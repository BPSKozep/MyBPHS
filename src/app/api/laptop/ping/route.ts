import { env } from "@/env/server";
import { verifyApiKeyRequest } from "@/lib/apiKeys";
import { getServerAuthSession } from "@/server/auth";

export async function GET(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.name && !(await verifyApiKeyRequest(request, "ping"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const puResponse = await fetch(env.PU_URL ?? "");
    if (puResponse.status === 200) {
      return new Response("Pong", { status: 200 });
    }
    return new Response("No Pong :((", { status: 400 });
  } catch (error) {
    return new Response(`Error fetching the URL: ${String(error)}`, {
      status: 500,
    });
  }
}
