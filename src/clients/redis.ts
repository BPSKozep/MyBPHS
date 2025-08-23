import { createClient } from "redis";
import { env } from "@/env/server";

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient> {
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

export async function disconnectRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.disconnect();
        redisClient = null;
    }
}

// Verification code operations
export interface VerificationData {
    code: string;
    expiry: number; // Unix timestamp
    name: string;
}

const VERIFICATION_PREFIX = "verification:";

export class VerificationCodeService {
    private redis: RedisClient;

    constructor(redis: RedisClient) {
        this.redis = redis;
    }

    private getKey(email: string): string {
        return `${VERIFICATION_PREFIX}${email}`;
    }

    async setCode(email: string, data: VerificationData): Promise<void> {
        const key = this.getKey(email);
        const ttl = Math.floor((data.expiry - Date.now()) / 1000); // TTL in seconds

        if (ttl <= 0) {
            throw new Error("Expiry time must be in the future");
        }

        await this.redis.setEx(key, ttl, JSON.stringify(data));
    }

    async getCode(email: string): Promise<VerificationData | null> {
        const key = this.getKey(email);
        const data = await this.redis.get(key);

        if (!data) {
            return null;
        }

        try {
            const parsed = JSON.parse(data) as VerificationData;

            // Double-check expiry (Redis TTL should handle this, but let's be safe)
            if (parsed.expiry < Date.now()) {
                await this.deleteCode(email);
                return null;
            }

            return parsed;
        } catch (error) {
            console.error("Failed to parse verification data:", error);
            await this.deleteCode(email);
            return null;
        }
    }

    async deleteCode(email: string): Promise<void> {
        const key = this.getKey(email);
        await this.redis.del(key);
    }

    async verifyAndDeleteCode(email: string, code: string): Promise<boolean> {
        const data = await this.getCode(email);

        if (!data || data.code !== code) {
            return false;
        }

        await this.deleteCode(email);
        return true;
    }

    async verifyCode(email: string, code: string): Promise<boolean> {
        const data = await this.getCode(email);
        return data !== null && data.code === code;
    }
}

export async function getVerificationService(): Promise<VerificationCodeService> {
    const redis = await getRedisClient();
    return new VerificationCodeService(redis);
}
