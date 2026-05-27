import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    const { stripeSubscriptionId } = userDoc.data() ?? {};

    if (!stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    // Cancel at period end — user keeps access until billing cycle ends
    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Stripe sets cancel_at to the period-end timestamp when cancel_at_period_end=true
    const endsAt = subscription.cancel_at ? subscription.cancel_at * 1000 : null;

    // Persist status in Firestore immediately (webhook will also fire)
    await db.collection("users").doc(userId).update({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: endsAt,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true, endsAt });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json({ error: "cancel error" }, { status: 500 });
  }
}
