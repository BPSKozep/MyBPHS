import { z } from "zod";
import { procedure, router } from "server/trpc";

import { User } from "models";
import { TRPCError } from "@trpc/server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const paymentsRouter = router({
    create: procedure.output(z.string()).mutation(async ({ ctx }) => {
        if (!ctx.session) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Unauthorized",
            });
        }

        const user = await User.findOne({
            email: ctx.session?.user?.email,
        });

        if (!user) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
            });
        }

        if (!user.blocked) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "User not blocked",
            });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            client_reference_id: user.email,
            line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
            success_url: process.env.NEXTAUTH_URL + "/lunch",
            cancel_url: process.env.NEXTAUTH_URL,
        });

        if (!session.url)
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create payment",
            });

        return session.url;
    }),
});

export default paymentsRouter;
