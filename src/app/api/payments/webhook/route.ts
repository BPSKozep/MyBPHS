import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { User } from "models";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    const signature = headers().get("stripe-signature") as string;

    const event = stripe.webhooks.constructEvent(
        await req.text(),
        signature,
        process.env.STRIPE_WEBHOOK_KEY!,
    );

    if (event.type !== "checkout.session.completed")
        return NextResponse.json("OK");

    const user_email = event.data.object.client_reference_id;

    const user = await User.findOne({
        email: user_email,
    });

    if (!user || !user.blocked) {
        if (event.data.object.payment_intent)
            stripe.refunds.create({
                payment_intent: event.data.object.payment_intent as string,
            });

        return NextResponse.json("OK");
    }

    user.blocked = false;

    await user.save();

    await fetch(process.env.PAYMENT_WEBHOOK!, {
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
