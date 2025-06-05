import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { env } from "@/env/server";

export const webhookRouter = createTRPCRouter({
    sendDiscordWebhook: protectedProcedure
        .input(
            z.object({
                type: z.enum(["Info", "Error", "Lunch"]),
                message: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            const webhookUrls = {
                Info: env.INFO_WEBHOOK,
                Error: env.ERROR_WEBHOOK,
                Lunch: env.LUNCH_WEBHOOK,
            };

            const webhookUrl = webhookUrls[input.type];
            if (!webhookUrl) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid webhook type",
                });
            }

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

            await fetch(webhookUrl, {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content:
                        (process.env.NODE_ENV === "production"
                            ? ""
                            : "DEV - ") +
                        localDate +
                        " - " +
                        input.message,
                }),
            });
        }),
});

export default webhookRouter;
