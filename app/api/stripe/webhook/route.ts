import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getPostHogClient } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";

function getPlanFromPriceId(priceId: string | undefined): string | null {
  if (!priceId) return null;
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_ID_FOUNDING_MONTHLY ?? ""]: "founding",
    [process.env.STRIPE_PRICE_ID_FOUNDING_ANNUAL ?? ""]: "founding",
    [process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY ?? ""]: "standard",
    [process.env.STRIPE_PRICE_ID_STANDARD_ANNUAL ?? ""]: "standard",
  };
  return map[priceId] ?? null;
}

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  if (process.env.NEXT_PUBLIC_ENV === "staging" && !stripeKey.startsWith("sk_test_")) {
    throw new Error("SAFETY: staging environment has a non-test Stripe key. Refusing to process webhook.");
  }
  const stripe = new Stripe(stripeKey);
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
        const plan = session.metadata?.plan ?? "founding";
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) throw new Error("Missing userId in session metadata");

        const userRef: FirebaseFirestore.DocumentReference = db.collection("users").doc(userId);
        const counterRef: FirebaseFirestore.DocumentReference = db.collection("config").doc("foundingCounter");

        // Use a transaction to atomically write user + increment founding counter (once per subscription)
        await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
          const userSnap = await tx.get(userRef);
          const wasNew = !userSnap.data()?.stripeSubscriptionId;

          tx.set(
            userRef,
            { plan, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId, updatedAt: Date.now() },
            { merge: true }
          );

          if (plan === "founding" && wasNew) {
            const counterSnap = await tx.get(counterRef);
            const claimed = (counterSnap.data()?.claimed as number) ?? 0;
            const cap = (counterSnap.data()?.cap as number) ?? 50;
            tx.set(counterRef, { claimed: claimed + 1, cap }, { merge: true });
          }
        });

        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "subscription_completed",
          properties: { stripe_customer_id: customerId, plan },
        });
        await posthog.shutdown();

        console.log("User subscribed:", userId, "→", plan);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer as string;

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
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            // cancel_at is set by Stripe when cancel_at_period_end=true; null otherwise
            currentPeriodEnd: sub.cancel_at ? sub.cancel_at * 1000 : null,
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
