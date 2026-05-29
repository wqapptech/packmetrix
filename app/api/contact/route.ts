import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!title || !description || !email || !email.includes("@")) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ error: "Email not configured" }, { status: 500 });

  const resend = new Resend(key);
  await resend.emails.send({
    from: "Packmetrix <noreply@packmetrix.com>",
    to: "hello@packmetrix.com",
    replyTo: email,
    subject: `Contact: ${title}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0d1b2e">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 16px">${title}</h2>
  <p style="color:#444;margin:0 0 24px;line-height:1.6;white-space:pre-wrap">${description}</p>
  <p style="color:#888;font-size:12px;margin:0;border-top:1px solid #eee;padding-top:12px">From: <a href="mailto:${email}" style="color:#1f5f8e">${email}</a></p>
</div>`,
  });

  return NextResponse.json({ ok: true });
}
