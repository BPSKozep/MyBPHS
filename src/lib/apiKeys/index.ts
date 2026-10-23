import { createHash, timingSafeEqual } from "node:crypto";
import { customAlphabet } from "nanoid";
import mongooseConnect from "@/clients/mongoose";
import ApiKey from "@/models/ApiKey.model";
import type { ApiScope } from "./scopes";

/**
 * Key format: `mybphs_<keyId>_<secret>`, both parts base62.
 * The keyId is public and used for lookup; only the SHA-256 of the full key is stored.
 */
const KEY_PREFIX = "mybphs";
const KEY_ID_LENGTH = 8;
const SECRET_LENGTH = 40;
const KEY_PATTERN = new RegExp(
  `^${KEY_PREFIX}_([0-9A-Za-z]{${KEY_ID_LENGTH}})_[0-9A-Za-z]{${SECRET_LENGTH}}$`,
);

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generateKeyId = customAlphabet(BASE62, KEY_ID_LENGTH);
const generateSecret = customAlphabet(BASE62, SECRET_LENGTH);

/** Only write lastUsedAt/lastUsedIp once per this interval per key. */
const LAST_USED_THROTTLE_MS = 60_000;

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function hashApiKey(key: string): string {
  return sha256(key).toString("hex");
}

/** Constant-time string comparison (hashing first equalizes lengths). */
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

export function generateApiKey() {
  const keyId = generateKeyId();
  const key = `${KEY_PREFIX}_${keyId}_${generateSecret()}`;
  return { key, keyId, secretHash: hashApiKey(key) };
}

export function maskApiKey(keyId: string): string {
  return `${KEY_PREFIX}_${keyId}_${"•".repeat(8)}`;
}

/** Extracts the token from an `Authorization: Bearer …` header. */
export function getBearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || undefined;
}

export function getClientIp(headers: Headers): string | undefined {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    undefined
  );
}

/** Checks a raw token against managed keys for a scope. */
export async function verifyApiKey(
  token: string | undefined,
  scope: ApiScope,
  ip?: string,
): Promise<boolean> {
  if (!token) return false;

  const match = KEY_PATTERN.exec(token);
  if (!match) return false;

  await mongooseConnect();
  const apiKey = await ApiKey.findOne({ keyId: match[1] });
  if (!apiKey) return false;

  const now = new Date();
  if (
    !timingSafeEqual(
      Buffer.from(hashApiKey(token), "hex"),
      Buffer.from(apiKey.secretHash, "hex"),
    ) ||
    apiKey.revokedAt ||
    (apiKey.expiresAt && apiKey.expiresAt <= now) ||
    !apiKey.scopes.includes(scope)
  ) {
    return false;
  }

  if (
    !apiKey.lastUsedAt ||
    now.getTime() - apiKey.lastUsedAt.getTime() > LAST_USED_THROTTLE_MS
  ) {
    await ApiKey.updateOne(
      { _id: apiKey._id },
      { $set: { lastUsedAt: now, lastUsedIp: ip } },
    ).catch((error: unknown) => {
      console.error("[api-keys] Failed to update lastUsedAt", error);
    });
  }

  return true;
}

/** Verifies the bearer token of an incoming request for a scope. */
export function verifyApiKeyRequest(
  request: Request,
  scope: ApiScope,
): Promise<boolean> {
  return verifyApiKey(
    getBearerToken(request),
    scope,
    getClientIp(request.headers),
  );
}
