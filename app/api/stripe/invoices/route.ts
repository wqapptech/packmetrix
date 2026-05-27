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
    const { stripeCustomerId } = userDoc.data() ?? {};

    if (!stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const result = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 24,
    });

    const invoices = result.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      created: inv.created,          // Unix seconds
      amount_paid: inv.amount_paid,  // cents
      currency: inv.currency,
      status: inv.status,            // "paid" | "open" | "void" | "uncollectible" | "draft"
      invoice_pdf: inv.invoice_pdf ?? null,
      hosted_invoice_url: inv.hosted_invoice_url ?? null,
    }));

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("Invoices fetch error:", err);
    return NextResponse.json({ error: "invoices error" }, { status: 500 });
  }
}
