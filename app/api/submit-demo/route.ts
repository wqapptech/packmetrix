export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { sendDemoRequestEmail } from "@/lib/email";

// ── Lightweight per-IP rate limiter ───────────────────────────────────────────
// In-memory; resets on cold start. Sufficient for a low-traffic landing page.
const _ipBucket = new Map<string, { n: number; resetAt: number }>();
const RATE_MAX = 3;
const RATE_WINDOW = 15 * 60 * 1000; // 15-minute window

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = _ipBucket.get(ip);
  if (!entry || now > entry.resetAt) {
    _ipBucket.set(ip, { n: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.n >= RATE_MAX) return false;
  entry.n++;
  return true;
}

function getIP(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ── Field validators ──────────────────────────────────────────────────────────

function isValidPhone(val: string): boolean {
  const digits = val.replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function isValidEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = getIP(req);
    if (!checkRate(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { name, agencyName, whatsapp, email, message, website } = body;

    // Honeypot — real users never fill this hidden field; bots typically do
    if (website) {
      return NextResponse.json({ success: true }); // silent discard
    }

    // Required field presence
    if (!name?.trim() || !agencyName?.trim() || !whatsapp?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Reject oversized payloads (blocks naive spam tooling)
    if (
      name.length > 120 ||
      agencyName.length > 200 ||
      whatsapp.length > 30 ||
      (email?.length ?? 0) > 200 ||
      (message?.length ?? 0) > 1000
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (!isValidPhone(whatsapp)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    if (email?.trim() && !isValidEmail(email.trim())) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const now = Date.now();
    await db.collection("leads").add({
      // Demo-request marker — filter with source == "demo_request" in the leads screen
      source: "demo_request",
      channel: "demo",
      status: "new",
      // Contact fields supplied by the prospect
      name: name.trim(),
      agencyName: agencyName.trim(),
      whatsapp: whatsapp.trim(),
      email: email?.trim() ?? "",
      message: message?.trim() ?? "",
      // Schema-compatibility fields (leads collection expects these; unused for demo leads)
      destination: agencyName.trim(),
      packageId: "",
      userId: "",
      price: "",
      createdAt: now,
      updatedAt: now,
    });

    // Fire-and-forget — a mail failure should not fail the user's submission
    sendDemoRequestEmail({ name: name.trim(), agencyName: agencyName.trim(), whatsapp: whatsapp.trim(), email: email?.trim() ?? "", message: message?.trim() ?? "" })
      .catch(e => console.error("submit-demo mail error:", e));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("submit-demo error:", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
