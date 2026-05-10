import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const body = await req.text();

  // ✅ FIX: await headers()
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  // -----------------------------
  // VERIFY WEBHOOK
  // -----------------------------
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error("Webhook signature error:", err);

    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // -----------------------------
  // HANDLE EVENTS
  // -----------------------------
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const userId = session.metadata?.userId;
        const customerId = session.customer as string;

        if (!userId) {
          throw new Error("Missing userId");
        }

        await db.collection("users").doc(userId).set(
          {
            plan: "pro",
            aiLimit: 999999,
            stripeCustomerId: customerId,
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        console.log("User upgraded:", userId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer as string;

        const snap = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .get();

        snap.forEach(async (doc) => {
          await doc.ref.update({
            plan: "free",
            aiLimit: 10,
            updatedAt: Date.now(),
          });
        });

        break;
      }

      default:
        console.log("Unhandled:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);

    return NextResponse.json(
      { error: "Webhook failed" },
      { status: 500 }
    );
  }
}