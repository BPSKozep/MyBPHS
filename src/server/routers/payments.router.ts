import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";
import { env } from "@/env/server";
import { User } from "@/models";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const paymentsRouter = createTRPCRouter({
  create: protectedProcedure.output(z.string()).mutation(async ({ ctx }) => {
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
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${env.NEXTAUTH_URL}/lunch`,
      cancel_url: env.NEXTAUTH_URL,
      allow_promotion_codes: true,
    });

    if (!session.url)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create payment",
      });

    return session.url;
  }),
});
