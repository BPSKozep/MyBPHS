import { createClient } from "redis";
import { env } from "@/env/server";
import { getServerAuthSession } from "@/server/auth";

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

async function getRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    if (!env.REDIS_URL) {
      throw new Error("REDIS_URL is not configured");
    }

    redisClient = createClient({
      url: env.REDIS_URL,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis Client Connected");
    });

    redisClient.on("ready", () => {
      console.log("Redis Client Ready");
    });

    redisClient.on("end", () => {
      console.log("Redis Client Connection Ended");
    });

    await redisClient.connect();
  }

  return redisClient;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const session = await getServerAuthSession();

  if (!session?.user?.name) {
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (!authHeader || authHeader !== expectedAuth) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const redis = await getRedisClient();

  try {
    const result = await redis.ping();

    return new Response(`Redis response: ${result}`, { status: 200 });
  } catch (error) {
    return new Response(`Redis response: ${String(error)}`, {
      status: 500,
    });
  }
}
