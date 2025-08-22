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

    try {
        const puResponse = await fetch(env.PU_URL ?? "");
        if (puResponse.status === 200) {
            return new Response("Pong", { status: 200 });
        }
        return new Response("No Pong :((", { status: 400 });
    } catch (error) {
        return new Response(
            "Error fetching the URL: " + (error as Error).message,
            { status: 500 },
        );
    }
}
