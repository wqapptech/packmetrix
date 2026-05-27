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
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    // Remove the scheduled cancellation
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update Firestore immediately
    await db.collection("users").doc(userId).update({
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reactivate subscription error:", err);
    return NextResponse.json({ error: "reactivate error" }, { status: 500 });
  }
}
