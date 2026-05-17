import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

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

    // Fetch user to check for existing Stripe customer/subscription
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() ?? {};
    const { stripeCustomerId, stripeSubscriptionId } = userData;

    // Derive return URL from request origin
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // If user already has an active subscription, send them to the billing portal to upgrade/downgrade
    if (stripeSubscriptionId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${origin}/paywall`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    const period = billingPeriod === "annual" ? "annual" : "monthly";
    const priceId = PRICE_IDS[plan]?.[period] ?? PRICE_IDS.grow[period];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
    };

    // Attach existing Stripe customer so we don't create duplicates
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: "stripe error" }, { status: 500 });
  }
}
