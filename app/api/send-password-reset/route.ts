export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { sendPasswordResetEmail } from "@/lib/email";

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === "production";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body.email?.trim();
    const redirectUrl: string = body.redirectUrl || "https://packmetrix.com/login";

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    if (!adminAuth) return NextResponse.json({ error: "Admin SDK not configured" }, { status: 500 });

    // Resolve the account first. For unknown addresses getUserByEmail throws a
    // clean auth/user-not-found — we swallow it and still report success so the
    // endpoint never reveals whether an account exists. (generatePasswordResetLink
    // on a missing user throws an opaque auth/internal-error, so we can't rely on
    // it for enumeration safety.)
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        return NextResponse.json({ success: true });
      }
      throw err;
    }
    if (!userRecord.email) return NextResponse.json({ success: true });

    // generatePasswordResetLink mints a real, single-use link (correct mode +
    // live oobCode) via the default Firebase action handler — sidestepping the
    // locked/broken Console email template. We deliver it through our own Resend
    // sender, exactly like the email-verification flow.
    const link = await adminAuth.generatePasswordResetLink(userRecord.email, { url: redirectUrl });

    if (!IS_PRODUCTION) {
      console.log("\n========================================");
      console.log("🔑  Password reset link (non-production):");
      console.log(link);
      console.log("========================================\n");
    }

    await sendPasswordResetEmail({
      to: userRecord.email,
      resetUrl: link,
      name: userRecord.displayName || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[send-password-reset] error:", err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to send password reset email" },
      { status: 500 }
    );
  }
}
