import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    LLM_ENDPOINT:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    LLM_API_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DOCUMENTS_ENDPOINT:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DOCUMENTS_AUTH:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    PU_TOKEN:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    PU_URL:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DISCORD_WEBHOOK:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    SLACK_WEBHOOK:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    RESEND_API_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    STRIPE_SECRET_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    STRIPE_PRICE_ID:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    STRIPE_WEBHOOK_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    REDIS_URL:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    LAPTOP_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    MONGODB_URI: z.string(),
    MONGODB_DATABASE: z.string(),
    NEXTAUTH_SECRET: z.string(),
    NEXTAUTH_URL: z.string(),
    GOOGLE_ID: z.string(),
    GOOGLE_SECRET: z.string(),
    PING_SECRET: z.string(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  experimental__runtimeEnv: process.env,
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
