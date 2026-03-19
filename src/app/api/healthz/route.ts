import mongoose from "mongoose";
import mongooseConnect from "@/clients/mongoose";
import { getRedisClient } from "@/clients/redis";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Content-Type": "application/json",
};

export async function GET() {
  const checks: Record<string, { ok: boolean; error?: string }> = {};

  // MongoDB check
  try {
    await mongooseConnect();
    checks.mongodb = { ok: mongoose.connection.readyState === 1 };
  } catch (err) {
    checks.mongodb = {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }

  // Redis check
  try {
    const redis = await getRedisClient();
    const pong = await redis.ping();
    checks.redis = { ok: pong === "PONG" };
  } catch (err) {
    checks.redis = {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return new Response(
    JSON.stringify({
      status: allOk ? "ok" : "degraded",
      checks,
    }),
    {
      status: allOk ? 200 : 503,
      headers: NO_CACHE_HEADERS,
    },
  );
}
