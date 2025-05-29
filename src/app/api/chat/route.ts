import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages, tool } from "ai";
import PasswordReset from "@/emails/password-reset";
import { generate } from "generate-password";
import { User } from "@/models";
import Chat from "@/models/Chat.model";
import { Resend } from "resend";
import { getServerAuthSession } from "@/server/auth";
import { z } from "zod";
import mongooseConnect from "@/clients/mongoose";
import { nanoid } from "nanoid";
import { env } from "@/env/server";
await mongooseConnect();

const SYSTEM = await (
    await fetch(`${env.DOCUMENTS_ENDPOINT}/prompt`, {
        headers: {
            Authorization: `Bearer ${env.DOCUMENTS_AUTH}`,
        },
    })
).text();

// Type definitions for better type safety
interface OpenAITool {
    type: string;
    function?: {
        parameters: Record<string, unknown> & {
            additionalProperties?: unknown;
            $schema?: unknown;
        };
    };
}

interface RequestBody extends Record<string, unknown> {
    tools?: OpenAITool[];
}

interface ChatMessage {
    content: string;
    role: "function" | "user" | "system" | "assistant" | "data" | "tool";
}

interface ChatRequest {
    messages: ChatMessage[];
}

type SearchResult = Record<string, unknown>;

const openai = createOpenAI({
    baseURL: env.LLM_ENDPOINT,
    apiKey: env.LLM_API_KEY,
    async fetch(input, init) {
        // Safely handle the request body
        if (!init?.body) {
            return fetch(input, init);
        }

        let body: RequestBody;
        try {
            const bodyString =
                typeof init.body === "string"
                    ? init.body
                    : init.body instanceof ArrayBuffer
                      ? new TextDecoder().decode(init.body)
                      : JSON.stringify(init.body);
            body = JSON.parse(bodyString) as RequestBody;
        } catch {
            return fetch(input, init);
        }

        const tools = body.tools;

        if (tools && Array.isArray(tools)) {
            const newTools: OpenAITool[] = [];

            for (const tool of tools) {
                if (tool.type === "function" && tool.function?.parameters) {
                    delete tool.function.parameters.additionalProperties;
                    delete tool.function.parameters.$schema;
                }

                newTools.push(tool);
            }

            body.tools = newTools;
        }

        if (init) init.body = JSON.stringify(body);

        return fetch(input, init);
    },
});

export const maxDuration = 60;

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(req: Request) {
    const session = await getServerAuthSession();

    if (!session?.user?.name)
        return new Response("Unauthorized", { status: 401 });

    const user = await User.findOne({
        email: session?.user.email,
    });

    if (!user) return new Response("Forbidden", { status: 403 });

    const requestData = (await req.json()) as ChatRequest;
    const { messages } = requestData;

    const coreMessages = convertToCoreMessages(messages);

    const names = session.user.name.split(" ");

    names.unshift(names.pop() ?? "");

    const emailName = names.join(" ");

    const user_details = `${session.user.name} (hu: ${emailName}, ${session.user.email})`;

    const dateTime = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "Europe/Budapest",
    }).format(new Date());

    let rag_context = "";

    try {
        const lastMessage = coreMessages[coreMessages.length - 1];
        if (!lastMessage?.content) {
            throw new Error("No valid message content");
        }

        const res = await fetch(`${env.DOCUMENTS_ENDPOINT}/search`, {
            headers: {
                Authorization: `Bearer ${env.DOCUMENTS_AUTH}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: lastMessage.content,
                num_docs: 1,
            }),
            method: "POST",
        });

        const searchResults = (await res.json()) as unknown[];
        rag_context = (searchResults[0] as string) ?? "No results found.";
    } catch (err) {
        console.log("rag failed", err);
        rag_context = "Retrieval failed.";
    }

    console.log(rag_context);

    const result = await streamText({
        model: openai("gemini-1.5-flash"),
        system: SYSTEM.replace("USER_DETAILS", user_details)
            .replace("CURRENT_TIME", dateTime)
            .replace("RAG_CONTEXT", rag_context),
        messages: coreMessages,
        tools: {
            fileTicket: tool({
                description: "File a ticket for IT",
                parameters: z.object({
                    title: z.string(),
                    description: z.string(),
                    severity: z.enum(["low", "medium", "high", "critical"]),
                }),
                async execute(body) {
                    console.log("ticket", body);
                    try {
                        await fetch(env.TICKET_WEBHOOK!, {
                            method: "post",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                content: `@everyone\n${body.title} - ${body.severity}\nSubmitted by: ${session.user.name} (${session.user.email})\n\n${body.description}`,
                            }),
                        });

                        return {
                            status: "Ticket created. ID: " + nanoid(),
                        };
                    } catch (err) {
                        console.error(err);
                        return {
                            status: "Something went wrong / ask user to write email to us",
                        };
                    }
                },
            }),
            resetPassword: tool({
                description:
                    "Reset the Active Directory password of the current user.",
                parameters: z.object({ reset: z.boolean() }),
                async execute() {
                    console.log("password");
                    try {
                        const password = generate({
                            numbers: true,
                            excludeSimilarCharacters: true,
                        });

                        await fetch(
                            `https://pu.bpskozep.hu/ad/password-reset/${user.email}`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${env.PU_TOKEN}`,
                                },
                                body: JSON.stringify({ password }),
                            },
                        );

                        user.laptopPasswordChanged = new Date();
                        await user.save();

                        await resend.emails.send({
                            from: "MyBPHS <my@bphs.hu>",
                            to: session.user.email ?? "",
                            subject: "Ideiglenes laptop jelszó",
                            react: PasswordReset({
                                name: emailName,
                                password: password,
                            }),
                        });

                        return {
                            status: "Temporary password sent via email.",
                        };
                    } catch (err) {
                        console.error(err);
                        return { status: "Unknown error / file ticket" };
                    }
                },
            }),
            search: tool({
                description:
                    "Search for additional information in internal documents",
                parameters: z.object({
                    query: z.string().describe("A search query"),
                }),
                async execute(body) {
                    console.log("search", body);
                    try {
                        const res = await fetch(
                            `${env.DOCUMENTS_ENDPOINT}/search`,
                            {
                                headers: {
                                    Authorization: `Bearer ${env.DOCUMENTS_AUTH}`,
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    query: body.query,
                                    num_docs: 2,
                                }),
                                method: "POST",
                            },
                        );

                        const searchResults =
                            (await res.json()) as SearchResult[];
                        return {
                            results: searchResults,
                        };
                    } catch (err) {
                        console.error(err);
                        return {
                            status: "Search failed / file ticket",
                        };
                    }
                },
            }),
        },
        maxSteps: 3,
        temperature: 0.4,
        async onFinish(event) {
            await new Chat({
                user: user._id,
                messages: [...coreMessages, ...event.responseMessages],
            }).save();
        },
    });

    return result.toDataStreamResponse();
}
