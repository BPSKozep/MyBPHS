import { env } from "@/env/server";
import { getServerAuthSession } from "@/server/auth";

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    const session = await getServerAuthSession();

    if (!session?.user?.name) {
        const expectedAuth = `Bearer ${env.PING_SECRET}`;
        if (!authHeader || authHeader !== expectedAuth) {
            return new Response("Unauthorized", { status: 401 });
        }
    }

    const llmResponse = await fetch("https://llm.bphs.hu");
    const promptResponse = await fetch("https://prompts.bphs.hu/ping");
    if (llmResponse.status === 200 && promptResponse.status === 200) {
        return new Response("Pong", { status: 200 });
    }

    return new Response("No Pong :((", { status: 400 });
}
