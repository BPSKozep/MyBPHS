import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/env/server";
import { User } from "@/models";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  if (!env.STRIPE_WEBHOOK_KEY) {
    throw new Error("STRIPE_WEBHOOK_KEY is not set");
  }

  if (!env.DISCORD_WEBHOOK) {
    throw new Error("DISCORD_WEBHOOK is not set");
  }

  const signature = (await headers()).get("stripe-signature");

  const event = stripe.webhooks.constructEvent(
    await req.text(),
    signature ?? "",
    env.STRIPE_WEBHOOK_KEY,
  );

  if (event.type !== "checkout.session.completed")
    return NextResponse.json("OK");

  const user_email = event.data.object.client_reference_id;

  const user = await User.findOne({
    email: user_email,
  });

  if (!user || !user.blocked) {
    if (event.data.object.payment_intent)
      await stripe.refunds.create({
        payment_intent: event.data.object.payment_intent as string,
      });

    return NextResponse.json("OK");
  }

  user.blocked = false;

  await user.save();

  await fetch(env.DISCORD_WEBHOOK, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: `${user.name} (${user.email}) has purchased a replacement token.`,
    }),
  });

  return NextResponse.json("OK");
}
