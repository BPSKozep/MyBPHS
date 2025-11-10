import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/env/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const webhookRouter = createTRPCRouter({
  sendDiscordWebhook: protectedProcedure
    .input(
      z
        .object({
          message: z.string().optional(),
          title: z.string().optional(),
          body: z.string().optional(),
          // Discord expects a decimal color integer (0 - 16777215)
          color: z.number().int().min(0).max(16777215).optional(),
          error: z.boolean().optional(),
        })
        .refine((data) => !!data.message || (!!data.title && !!data.body), {
          message: "Either 'message' or both 'title' and 'body' are required",
        }),
    )
    .mutation(async ({ input }) => {
      const date = new Date();
      const localDate = date.toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZone: "Europe/Budapest",
      });

      if (!env.DISCORD_WEBHOOK) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Webhook URL is not set",
        });
      }

      const isDev = process.env.NODE_ENV !== "production";

      // If title and body are provided, send as an embed
      if (input.title && input.body) {
        const embed = {
          title: (isDev ? "DEV - " : "") + input.title,
          description: input.body,
          color: input.color ?? (input.error ? 16711680 : 16432932), // default yellow - error red
          footer: {
            text: localDate,
          },
        };

        await fetch(env.DISCORD_WEBHOOK, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [embed],
          }),
        });
        return;
      }

      // Fallback to simple content message for backward compatibility
      await fetch(env.DISCORD_WEBHOOK, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `${(isDev ? "DEV - " : "") + localDate} - ${input.message ?? ""}`,
        }),
      });
    }),
});

export default webhookRouter;
