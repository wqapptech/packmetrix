import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const PRICE_IDS: Record<string, Record<string, string>> = {
  founding: {
    monthly: process.env.STRIPE_PRICE_ID_FOUNDING_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_ID_FOUNDING_ANNUAL ?? "",
  },
  standard: {
    monthly: process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_ID_STANDARD_ANNUAL ?? "",
  },
};

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const { userId, plan = "founding", billingPeriod = "monthly" } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() ?? {};
    const { stripeCustomerId, stripeSubscriptionId } = userData;

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (stripeSubscriptionId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${origin}/paywall`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    // Enforce founding cap server-side: fall back to standard if sold out
    let resolvedPlan = plan === "founding" || plan === "standard" ? plan : "founding";
    if (resolvedPlan === "founding") {
      const counterSnap = await db.collection("config").doc("foundingCounter").get();
      const counter = counterSnap.data() ?? { claimed: 0, cap: 50 };
      if ((counter.claimed ?? 0) >= (counter.cap ?? 50)) {
        resolvedPlan = "standard";
      }
    }

    const period = billingPeriod === "annual" ? "annual" : "monthly";
    const priceId = PRICE_IDS[resolvedPlan]?.[period];

    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // {CHECKOUT_SESSION_ID} is replaced by Stripe with the real session ID at redirect time.
      // The paywall page reads this param and calls /api/stripe/confirm-session to update
      // Firestore immediately, making subscription display webhook-independent.
      success_url: `${origin}/paywall?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/paywall`,
      metadata: { userId, plan: resolvedPlan },
      subscription_data: {
        metadata: { userId, plan: resolvedPlan },
      },
    };

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
