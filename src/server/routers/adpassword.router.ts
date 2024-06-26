import { procedure, router } from "server/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { User } from "models";

const puToken = process.env.PU_TOKEN;

const adPasswordRouter = router({
    getLastChanged: procedure.query(async ({ ctx }) => {
        const user = await User.findOne({
            email: ctx.session?.user?.email,
        });

        if (!user) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
            });
        }

        if (!user.laptopPasswordChanged) {
            return;
        } else {
            const dateTime = new Intl.DateTimeFormat("hu-HU", {
                dateStyle: "medium",
                timeStyle: "medium",
                timeZone: "Europe/Budapest",
            });
            return dateTime.format(user.laptopPasswordChanged);
        }
    }),
    setNewPassword: procedure
        .input(z.string().min(6))
        .mutation(async ({ ctx, input }) => {
            const user = await User.findOne({
                email: ctx.session?.user?.email,
            });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }
            await fetch(
                `https://pu.bpskozep.hu/ad/password-reset/${user.email}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${puToken}`,
                    },
                    body: JSON.stringify({ password: input }),
                }
            );

            user.laptopPasswordChanged = new Date();
            await user.save();
            return;
        }),
});

export default adPasswordRouter;
