import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getPostHogClient } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";

function getPlanFromPriceId(priceId: string | undefined): string | null {
  if (!priceId) return null;
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_ID_START_MONTHLY ?? ""]: "start",
    [process.env.STRIPE_PRICE_ID_START_ANNUAL ?? ""]: "start",
    [process.env.STRIPE_PRICE_ID_GROW_MONTHLY ?? ""]: "grow",
    [process.env.STRIPE_PRICE_ID_GROW_ANNUAL ?? ""]: "grow",
    [process.env.STRIPE_PRICE_ID_SCALE_MONTHLY ?? ""]: "scale",
    [process.env.STRIPE_PRICE_ID_SCALE_ANNUAL ?? ""]: "scale",
    [process.env.STRIPE_PRICE_ID ?? ""]: "grow",
    [process.env.STRIPE_PRICE_ID_ANNUAL ?? ""]: "grow",
  };
  return map[priceId] ?? null;
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const buf = await req.arrayBuffer();
  const body = Buffer.from(buf);

  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan ?? "grow";
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) throw new Error("Missing userId in session metadata");

        await db.collection("users").doc(userId).set(
          {
            plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "subscription_completed",
          properties: { stripe_customer_id: customerId, plan },
        });
        await posthog.shutdown();

        console.log("User upgraded:", userId, "→", plan);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer as string;

        // Plan can come from subscription metadata (set at checkout) or from price ID mapping
        const planFromMeta = sub.metadata?.plan;
        const priceId = sub.items?.data[0]?.price?.id;
        const plan = planFromMeta || getPlanFromPriceId(priceId);

        if (!plan) {
          console.log("subscription.updated: could not resolve plan, skipping");
          break;
        }

        const snap = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .get();

        const posthog = getPostHogClient();
        const updates = snap.docs.map((docSnap: FirebaseFirestore.QueryDocumentSnapshot) =>
          docSnap.ref.update({
            plan,
            stripeSubscriptionId: sub.id,
            updatedAt: Date.now(),
          })
        );
        await Promise.all(updates);

        snap.docs.forEach((docSnap: FirebaseFirestore.QueryDocumentSnapshot) => {
          posthog.capture({
            distinctId: docSnap.id,
            event: "subscription_updated",
            properties: { stripe_customer_id: customerId, plan },
          });
        });
        await posthog.shutdown();

        console.log("Subscription updated for customer:", customerId, "→", plan);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer as string;

        const snap = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .get();

        const posthog = getPostHogClient();
        const updates = snap.docs.map((docSnap: FirebaseFirestore.QueryDocumentSnapshot) =>
          docSnap.ref.update({
            plan: "free",
            stripeSubscriptionId: null,
            updatedAt: Date.now(),
          })
        );
        await Promise.all(updates);

        snap.docs.forEach((docSnap: FirebaseFirestore.QueryDocumentSnapshot) => {
          posthog.capture({
            distinctId: docSnap.id,
            event: "subscription_cancelled",
            properties: { stripe_customer_id: customerId },
          });
        });
        await posthog.shutdown();

        break;
      }

      default:
        console.log("Unhandled event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
