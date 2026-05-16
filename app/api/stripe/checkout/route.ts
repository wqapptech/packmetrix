import Stripe from "stripe";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PRICE_IDS: Record<string, Record<string, string>> = {
  start: {
    monthly: process.env.STRIPE_PRICE_ID_START_MONTHLY ?? process.env.STRIPE_PRICE_ID ?? "",
    annual: process.env.STRIPE_PRICE_ID_START_ANNUAL ?? process.env.STRIPE_PRICE_ID_ANNUAL ?? "",
  },
  grow: {
    monthly: process.env.STRIPE_PRICE_ID_GROW_MONTHLY ?? process.env.STRIPE_PRICE_ID ?? "",
    annual: process.env.STRIPE_PRICE_ID_GROW_ANNUAL ?? process.env.STRIPE_PRICE_ID_ANNUAL ?? "",
  },
  scale: {
    monthly: process.env.STRIPE_PRICE_ID_SCALE_MONTHLY ?? process.env.STRIPE_PRICE_ID ?? "",
    annual: process.env.STRIPE_PRICE_ID_SCALE_ANNUAL ?? process.env.STRIPE_PRICE_ID_ANNUAL ?? "",
  },
};

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const { userId, plan = "grow", billingPeriod = "monthly" } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const period = billingPeriod === "annual" ? "annual" : "monthly";
    const priceId = PRICE_IDS[plan]?.[period] ?? PRICE_IDS.grow[period];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
      metadata: { userId, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: "stripe error" }, { status: 500 });
  }
}
