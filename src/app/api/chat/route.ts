import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages, tool } from "ai";
import PasswordReset from "emails/password-reset";
import { generate } from "generate-password";
import { User } from "models";
import Chat from "models/Chat.model";
import { Resend } from "resend";
import { getServerAuthSession } from "server/auth";
import { z } from "zod";
import mongooseConnect from "clients/mongoose";

await mongooseConnect();

const SYSTEM = await (
    await fetch(`${process.env.DOCUMENTS_ENDPOINT}/prompt`, {
        headers: {
            Authorization: `Bearer ${process.env.DOCUMENTS_AUTH}`,
        },
    })
).text();

const openai = createOpenAI({
    baseURL: process.env.LLM_ENDPOINT,
    apiKey: process.env.LLM_API_KEY,
    async fetch(input, init) {
        const body = JSON.parse(String(init?.body));

        const tools = body.tools;

        if (tools) {
            const newTools = [];

            for (const tool of tools) {
                if (tool.type === "function") {
                    delete tool.function.parameters.additionalProperties;
                    delete tool.function.parameters["$schema"];
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

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const session = await getServerAuthSession();

    if (!session || !session.user.name)
        return new Response("Unauthorized", { status: 401 });

    const user = await User.findOne({
        email: session?.user.email,
    });

    if (!user) return new Response("Forbidden", { status: 403 });

    const { messages } = await req.json();

    const coreMessages = convertToCoreMessages(messages);

    const names = session.user.name.split(" ");

    names.unshift(names.pop() || "");

    const emailName = names.join(" ");

    const user_details = `${session.user.name} (hu: ${emailName}, ${session.user.email})`;

    const dateTime = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "Europe/Budapest",
    }).format(new Date());

    let rag_context = "";

    try {
        const res = await fetch(`${process.env.DOCUMENTS_ENDPOINT}/search`, {
            headers: {
                Authorization: `Bearer ${process.env.DOCUMENTS_AUTH}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: coreMessages[coreMessages.length - 1].content,
                num_docs: 1,
            }),
            method: "POST",
        });

        rag_context = (await res.json())[0];
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
                        await fetch(process.env.TICKET_WEBHOOK || "", {
                            method: "post",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                content: `@everyone\n${body.title} - ${body.severity}\nSubmitted by: ${session.user.name} (${session.user.email})\n\n${body.description}`,
                            }),
                        });

                        return {
                            status: "Ticket created.",
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
                                    Authorization: `Bearer ${process.env.PU_TOKEN}`,
                                },
                                body: JSON.stringify({ password }),
                            },
                        );

                        user.laptopPasswordChanged = new Date();
                        await user.save();

                        await resend.emails.send({
                            from: "MyBPHS <my@bphs.hu>",
                            to: session.user.email || [],
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
                            `${process.env.DOCUMENTS_ENDPOINT}/search`,
                            {
                                headers: {
                                    Authorization: `Bearer ${process.env.DOCUMENTS_AUTH}`,
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    query: body.query,
                                    num_docs: 2,
                                }),
                                method: "POST",
                            },
                        );

                        return {
                            results: await res.json(),
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
                user: user.id,
                messages: [...coreMessages, ...event.responseMessages],
            }).save();
        },
    });

    return result.toDataStreamResponse();
}
