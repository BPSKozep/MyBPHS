import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/env/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

function getS3Client() {
  if (
    !env.S3_ENDPOINT ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY ||
    !env.S3_REGION
  ) {
    return null;
  }

  return new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

/**
 * Compute a SHA-256 hash of the image buffer for change detection.
 */
async function computeHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getS3Key(email: string): string {
  return email.replace(/[^a-zA-Z0-9@._-]/g, "_");
}

export const profilePictureRouter = createTRPCRouter({
  /**
   * Sync the user's Google profile picture to R2 storage.
   *
   * Upload happens server-side so metadata is written reliably.
   * Presigned PUTs cannot carry x-amz-meta-* headers through CF R2 — they
   * are silently dropped, making hash-based deduplication impossible.
   *
   * Cache strategy (two-level, cheapest check first):
   *   1. HeadObject → read stored google-image-url metadata from R2.
   *      If the URL hasn't changed the image hasn't changed → skip fetch.
   *   2. If the URL did change, fetch the new image, compare SHA-256 hashes.
   *      Upload only when content actually differs.
   */
  checkAndGetUploadUrl: protectedProcedure
    .input(z.object({ googleImageUrl: z.string().url() }))
    .output(
      z.object({
        needsUpload: z.boolean(),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const s3Client = getS3Client();
      if (!s3Client || !env.S3_BUCKET_NAME) {
        return { needsUpload: false, message: "S3 not configured" };
      }

      const email = ctx.session.user.email;
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email not found in session",
        });
      }

      const key = getS3Key(email);
      const bucket = env.S3_BUCKET_NAME;

      // ── Level 1: URL cache (cheapest — no Google fetch required) ──────────
      let storedHash: string | null = null;
      let storedUrl: string | null = null;
      try {
        const headResponse = await s3Client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        storedHash = headResponse.Metadata?.["google-image-hash"] ?? null;
        storedUrl = headResponse.Metadata?.["google-image-url"] ?? null;
      } catch {
        // Object doesn't exist yet — fall through to upload.
      }

      if (storedHash && storedUrl === input.googleImageUrl) {
        return { needsUpload: false, message: "Image already up to date" };
      }

      // ── Level 2: Hash comparison (fetch required) ─────────────────────────
      const googleResponse = await fetch(input.googleImageUrl);
      if (!googleResponse.ok) {
        return { needsUpload: false, message: "Failed to fetch Google image" };
      }

      const imageBuffer = await googleResponse.arrayBuffer();
      const imageHash = await computeHash(imageBuffer);
      const contentType =
        googleResponse.headers.get("content-type") ?? "image/jpeg";

      if (storedHash && storedHash === imageHash) {
        return { needsUpload: false, message: "Image already up to date" };
      }

      // ── Upload directly from the server ───────────────────────────────────
      // Metadata is written inline with the object — no presigned URL required.
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: Buffer.from(imageBuffer),
          ContentType: contentType,
          Metadata: {
            "google-image-hash": imageHash,
            "google-image-url": input.googleImageUrl,
          },
        }),
      );

      return { needsUpload: true, message: "Profile picture updated" };
    }),

  /**
   * Get profile picture URL for a user by email
   */
  getUrl: protectedProcedure
    .input(z.object({ email: z.string().email().optional() }))
    .output(
      z.object({
        url: z.string().nullable(),
        exists: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const s3Client = getS3Client();
      if (!s3Client || !env.S3_BUCKET_NAME) {
        return { url: null, exists: false };
      }

      const email = input.email || ctx.session.user.email;
      if (!email) {
        return { url: null, exists: false };
      }

      const key = getS3Key(email);

      try {
        // Check if the image exists
        const headCommand = new HeadObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
        });
        await s3Client.send(headCommand);

        // Generate a presigned GET URL for reading
        const getCommand = new GetObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
        });
        const presignedUrl = await getSignedUrl(s3Client, getCommand, {
          expiresIn: 3600, // 1 hour
        });

        return {
          url: presignedUrl,
          exists: true,
        };
      } catch {
        // Object doesn't exist
        return {
          url: null,
          exists: false,
        };
      }
    }),
});
