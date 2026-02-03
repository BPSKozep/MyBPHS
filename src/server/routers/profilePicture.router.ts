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
 * Compute a SHA-256 hash of the image buffer for comparison
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
   * Check if profile picture needs to be uploaded and return presigned URL if so
   */
  checkAndGetUploadUrl: protectedProcedure
    .input(z.object({ googleImageUrl: z.string().url() }))
    .output(
      z.object({
        needsUpload: z.boolean(),
        presignedUrl: z.string().optional(),
        contentType: z.string().optional(),
        googleImageHash: z.string().optional(),
        imageBase64: z.string().optional(),
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

      // Fetch the Google image to get its content
      const googleResponse = await fetch(input.googleImageUrl);
      if (!googleResponse.ok) {
        return { needsUpload: false, message: "Failed to fetch Google image" };
      }

      const googleImageBuffer = await googleResponse.arrayBuffer();
      const googleImageHash = await computeHash(googleImageBuffer);
      const contentType =
        googleResponse.headers.get("content-type") || "image/jpeg";

      // Check if image already exists in S3 with matching hash
      let existingHash: string | null = null;
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
        });
        const headResponse = await s3Client.send(headCommand);
        existingHash = headResponse.Metadata?.["google-image-hash"] || null;
      } catch {
        // Object doesn't exist, that's fine
      }

      // If hashes match, no upload needed
      if (existingHash && existingHash === googleImageHash) {
        return { needsUpload: false, message: "Image already up to date" };
      }

      // Generate presigned URL for upload
      const putCommand = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        Metadata: {
          "google-image-hash": googleImageHash,
        },
      });

      const presignedUrl = await getSignedUrl(s3Client, putCommand, {
        expiresIn: 300, // 5 minutes
        signableHeaders: new Set(["content-type"]),
      });

      return {
        needsUpload: true,
        presignedUrl,
        contentType,
        googleImageHash,
        imageBase64: Buffer.from(googleImageBuffer).toString("base64"),
      };
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
