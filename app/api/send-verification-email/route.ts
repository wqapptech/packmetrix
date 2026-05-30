export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { sendVerificationEmail } from "@/lib/email";

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === "production";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body.email;
    const redirectUrl: string = body.redirectUrl || "https://agency.packmetrix.com/builder";

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    if (!adminAuth) return NextResponse.json({ error: "Admin SDK not configured" }, { status: 500 });

    const userRecord = await adminAuth.getUserByEmail(email);
    if (!userRecord.email) return NextResponse.json({ error: "No email on account" }, { status: 400 });
    if (userRecord.emailVerified) return NextResponse.json({ error: "Already verified" }, { status: 400 });

    const link = await adminAuth.generateEmailVerificationLink(userRecord.email, { url: redirectUrl });

    if (!IS_PRODUCTION) {
      console.log("\n========================================");
      console.log("📧  Verification link (non-production):");
      console.log(link);
      console.log("========================================\n");
    }

    await sendVerificationEmail({
      to: userRecord.email,
      verificationUrl: link,
      name: userRecord.displayName || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[send-verification-email] error:", err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to send verification email" },
      { status: 500 }
    );
  }
}
