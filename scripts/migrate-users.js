/**
 * One-time migration script.
 *
 * What it does:
 *  1. Adds `trialEndsAt` (createdAt + 60 days) to any user missing it.
 *  2. Fixes users with plan = "pro" by looking up their active Stripe
 *     subscription and mapping the price ID to the real plan name.
 *     Falls back to "grow" if the price ID is unrecognised.
 *  3. Removes the `aiLimit` field from every user document (limit is now
 *     derived from `plan` at runtime via planAiLimit()).
 *
 * Run (Node 20+ — reads .env.local automatically):
 *   node --env-file=.env.local scripts/migrate-users.js
 *
 * Required env vars (same as .env.local):
 *   FIREBASE_ADMIN_KEY
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_ID_START_MONTHLY   STRIPE_PRICE_ID_START_ANNUAL
 *   STRIPE_PRICE_ID_GROW_MONTHLY    STRIPE_PRICE_ID_GROW_ANNUAL
 *   STRIPE_PRICE_ID_SCALE_MONTHLY   STRIPE_PRICE_ID_SCALE_ANNUAL
 */

const admin  = require("firebase-admin");
const Stripe = require("stripe");

// ---------------------------------------------------------------------------
// Bootstrap Firebase Admin
// ---------------------------------------------------------------------------
const rawKey = process.env.FIREBASE_ADMIN_KEY;
if (!rawKey) throw new Error("Missing FIREBASE_ADMIN_KEY");

const serviceAccount = JSON.parse(rawKey);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db     = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ---------------------------------------------------------------------------
// Price ID → plan name map (built from env vars)
// ---------------------------------------------------------------------------
const PRICE_TO_PLAN = {};
const priceEnvs = [
  ["STRIPE_PRICE_ID_START_MONTHLY", "start"],
  ["STRIPE_PRICE_ID_START_ANNUAL",  "start"],
  ["STRIPE_PRICE_ID_GROW_MONTHLY",  "grow"],
  ["STRIPE_PRICE_ID_GROW_ANNUAL",   "grow"],
  ["STRIPE_PRICE_ID_SCALE_MONTHLY", "scale"],
  ["STRIPE_PRICE_ID_SCALE_ANNUAL",  "scale"],
];
for (const [envKey, plan] of priceEnvs) {
  const id = process.env[envKey];
  if (id) PRICE_TO_PLAN[id] = plan;
}

const TRIAL_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Resolve the real plan for a Stripe customer
// ---------------------------------------------------------------------------
async function resolveStripePlan(stripeCustomerId) {
  try {
    const subs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status:   "all",
      limit:    10,
    });

    const active = subs.data.find(
      (s) => s.status === "active" || s.status === "trialing"
    );

    if (!active) return "free"; // cancelled before we fixed the webhook

    const priceId = active.items.data[0]?.price?.id;
    return PRICE_TO_PLAN[priceId] ?? "grow"; // default to grow if unknown price
  } catch (err) {
    console.warn(`  Stripe lookup failed for ${stripeCustomerId}:`, err.message);
    return "grow";
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const snap = await db.collection("users").get();
  console.log(`Found ${snap.size} users.`);

  let fixed = 0;

  for (const docSnap of snap.docs) {
    const uid  = docSnap.id;
    const user = docSnap.data();
    const update = {};

    // 1. Inject trialEndsAt if missing
    if (!user.trialEndsAt) {
      const base = user.createdAt || Date.now();
      update.trialEndsAt = base + TRIAL_DAYS_MS;
      console.log(`[${uid}] trialEndsAt set from createdAt`);
    }

    // 2. Fix plan = "pro"
    if (user.plan === "pro") {
      if (user.stripeCustomerId) {
        const realPlan = await resolveStripePlan(user.stripeCustomerId);
        update.plan = realPlan;
        console.log(`[${uid}] plan: pro → ${realPlan}`);
      } else {
        // Paid without a customer ID — shouldn't happen, but be safe
        update.plan = "grow";
        console.log(`[${uid}] plan: pro → grow (no stripeCustomerId)`);
      }
    }

    // 3. Remove aiLimit field
    if ("aiLimit" in user) {
      update.aiLimit = admin.firestore.FieldValue.delete();
      console.log(`[${uid}] aiLimit removed`);
    }

    if (Object.keys(update).length > 0) {
      await docSnap.ref.set(update, { merge: true });
      fixed++;
    }
  }

  console.log(`\nDone. ${fixed}/${snap.size} users updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
