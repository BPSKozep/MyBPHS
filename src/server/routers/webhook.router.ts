import { z } from "zod";
import { procedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

const webhookRouter = router({
    sendDiscordWebhook: procedure
        .input(
            z.object({
                type: z.enum(["Info", "Error", "Lunch"]),
                message: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

            const webhookUrls = {
                Info: process.env.INFO_WEBHOOK,
                Error: process.env.ERROR_WEBHOOK,
                Lunch: process.env.LUNCH_WEBHOOK,
            };

            const webhookUrl =
                webhookUrls[input.type as keyof typeof webhookUrls];
            if (!webhookUrl) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid webhook type",
                });
            }

            await fetch(webhookUrl, {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: "MyBPHS",
                    content: input.message,
                }),
            });
        }),
});

export default webhookRouter;
