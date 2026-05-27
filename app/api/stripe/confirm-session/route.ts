import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const { sessionId, userId } = await req.json();
    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing sessionId or userId" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Only accept fully paid / completed sessions
    if (session.status !== "complete" && session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const plan = session.metadata?.plan ?? "founding";

    // Write to Firestore — idempotent; safe to call even if webhook already ran
    await db.collection("users").doc(userId).set(
      {
        plan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: Date.now(),
      },
      { merge: true },
    );

    return NextResponse.json({ plan, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId });
  } catch (err) {
    console.error("Confirm session error:", err);
    return NextResponse.json({ error: "confirm failed" }, { status: 500 });
  }
}
