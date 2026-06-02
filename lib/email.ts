import { Resend } from "resend";
import type { DnsRecord } from "./domain-sync";

// Emails are suppressed on non-production environments to avoid sending real
// messages during staging tests. Set NEXT_PUBLIC_ENV=production in apphosting.yaml.
const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === "production";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const FROM = "Packmetrix <noreply@packmetrix.com>";
const ADMIN_TO = "waleed@taaly.nl";

// ── Admin: new domain request notification ────────────────────────────────────

export async function sendDomainRequestedAdminEmail(opts: {
  agencyName: string;
  agencyEmail: string;
  hostname: string;
  adminUrl: string;
}): Promise<void> {
  const { agencyName, agencyEmail, hostname, adminUrl } = opts;
  await client().emails.send({
    from: FROM,
    to: ADMIN_TO,
    subject: `Domain request: ${hostname} (${agencyName})`,
    html: `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0d1b2e">
  <h2 style="font-size:18px;font-weight:700;margin:0 0 6px">New custom domain request</h2>
  <p style="color:#888;font-size:12px;margin:0 0 24px">Submitted via packmetrix.com</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:8px 0;color:#666;font-size:13px;padding-right:16px;vertical-align:top">Agency</td><td style="padding:8px 0;font-size:13px;font-weight:600">${agencyName}</td></tr>
    <tr><td style="padding:8px 0;color:#666;font-size:13px;padding-right:16px">Email</td><td style="padding:8px 0;font-size:13px"><a href="mailto:${agencyEmail}" style="color:#1f5f8e">${agencyEmail}</a></td></tr>
    <tr><td style="padding:8px 0;color:#666;font-size:13px;padding-right:16px">Hostname</td><td style="padding:8px 0;font-family:monospace;font-size:13px;font-weight:600">${hostname}</td></tr>
  </table>
  <p style="color:#555;margin:0 0 16px"><strong>Steps:</strong></p>
  <ol style="color:#555;margin:0 0 24px;padding-left:20px;line-height:2">
    <li>Add <strong>${hostname}</strong> as a custom domain in the <a href="https://console.firebase.google.com" style="color:#1f5f8e">Firebase App Hosting console</a></li>
    <li>Copy the DNS records Firebase generates</li>
    <li>Paste them into the admin page</li>
  </ol>
  <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#1f5f8e;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Open admin page →</a>
</div>`,
  });
}

// ── Agency: DNS records ready ─────────────────────────────────────────────────

export async function sendDomainRecordsReadyEmail(opts: {
  to: string;
  hostname: string;
  dnsRecords: DnsRecord[];
}): Promise<void> {
  if (!IS_PRODUCTION) return;
  const { to, hostname, dnsRecords } = opts;

  const recordRows = dnsRecords
    .map(r => `<tr style="border-bottom:1px solid #eee">
      <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#333">${r.type}</td>
      <td style="padding:8px 12px;font-family:monospace;font-size:11px;color:#333">${r.name}</td>
      <td style="padding:8px 12px;font-family:monospace;font-size:11px;word-break:break-all;color:#333">${r.value}</td>
    </tr>`)
    .join("");

  await client().emails.send({
    from: FROM,
    to,
    subject: `Action required: Add DNS records for ${hostname}`,
    html: `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0d1b2e">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">Your DNS records are ready</h2>
  <p style="color:#555;margin:0 0 24px">Add the following DNS records at your domain registrar to activate <strong>${hostname}</strong>. Once added, verification usually completes within a few hours (up to 48h).</p>

  <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;margin-bottom:24px">
    <thead>
      <tr style="background:#f7f7f7">
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#999">Type</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#999">Name</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#999">Value</th>
      </tr>
    </thead>
    <tbody>${recordRows}</tbody>
  </table>

  <p style="color:#555;margin:0 0 8px"><strong>How to add them:</strong> Log in to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.) → open DNS settings → add each record above. For the Name column, enter only the subdomain part (e.g. "www") — your registrar appends the domain automatically.</p>
  <p style="color:#555;margin:0 0 24px">We'll email you once your domain is live. You can also check the status anytime from your <a href="https://packmetrix.com/profile" style="color:#1f5f8e">profile page</a>.</p>
  <p style="color:#888;font-size:12px;margin:0">Need help? Reply to this email and we'll walk you through it.</p>
</div>`,
  });
}

export async function sendDomainActiveEmail(opts: {
  to: string;
  hostname: string;
}): Promise<void> {
  if (!IS_PRODUCTION) return;
  const { to, hostname } = opts;
  await client().emails.send({
    from: FROM,
    to,
    subject: `Your domain ${hostname} is live!`,
    html: `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0d1b2e">
  <div style="width:48px;height:48px;border-radius:12px;background:#d1fae5;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:20px">✓</div>
  <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">Your domain is live</h2>
  <p style="color:#555;margin:0 0 24px"><strong>${hostname}</strong> is now active and serving your packages with a valid SSL certificate.</p>
  <a href="https://${hostname}" style="display:inline-block;padding:12px 24px;background:#1f5f8e;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Visit your site →</a>
  <p style="color:#888;font-size:12px;margin:24px 0 0">Questions? Reply to this email and we'll help.</p>
</div>`,
  });
}

export async function sendVerificationEmail(opts: {
  to: string;
  verificationUrl: string;
  name?: string;
}): Promise<void> {
  const { to, verificationUrl, name } = opts;
  const greeting = name ? `Hi ${name},` : "Hi there,";
  await client().emails.send({
    from: FROM,
    to,
    subject: "Verify your Packmetrix email address",
    html: `
<div style="font-family:system-ui,-apple-system,sans-serif;background:#f4f1eb;padding:40px 0;min-height:100vh">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:#0d1b2e;padding:32px 40px;display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;border-radius:8px;background:#b08a3e;display:inline-flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:16px;font-weight:700;color:#fff;vertical-align:middle">P</div>
      <span style="font-family:Georgia,serif;font-size:22px;color:#f5f0e8;letter-spacing:-0.4px;vertical-align:middle">Packmetrix</span>
    </div>

    <!-- Body -->
    <div style="padding:40px">
      <div style="width:56px;height:56px;border-radius:50%;background:#fef9ec;display:flex;align-items:center;justify-content:center;margin-bottom:24px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b08a3e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </div>

      <p style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#b08a3e;margin:0 0 12px">&nbsp;Verify your email</p>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#0d1b2e;margin:0 0 16px;letter-spacing:-0.5px;line-height:1.1">One quick step,<br/>then you're in.</h1>
      <p style="font-size:14px;color:#5a6170;line-height:1.6;margin:0 0 32px">${greeting} Click the button below to verify your email address and activate your Packmetrix account.</p>

      <a href="${verificationUrl}" style="display:inline-block;padding:14px 32px;background:#b08a3e;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:-0.2px;box-shadow:0 1px 3px rgba(176,138,62,.35)">Verify my email address →</a>

      <p style="font-size:12px;color:#9ca3af;margin:28px 0 0;line-height:1.6">If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${verificationUrl}" style="color:#b08a3e;word-break:break-all">${verificationUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px 28px;border-top:1px solid #f0ece4">
      <p style="font-size:11.5px;color:#9ca3af;margin:0;line-height:1.6">If you didn't create a Packmetrix account, you can safely ignore this email.<br/>© 2026 Packmetrix · <a href="https://packmetrix.com/privacy" style="color:#9ca3af;text-decoration:none">Privacy</a> · <a href="mailto:hello@packmetrix.com" style="color:#9ca3af;text-decoration:none">Contact</a></p>
    </div>

  </div>
</div>`,
  });
}

export async function sendDemoRequestEmail(opts: {
  name: string;
  agencyName: string;
  whatsapp: string;
  email: string;
  message: string;
}): Promise<void> {
  const { name, agencyName, whatsapp, email, message } = opts;
  const replyTo = email || undefined;
  const messageRow = message
    ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;padding-right:16px">Message</td><td style="padding:8px 0;font-size:13px;color:#0d1b2e;white-space:pre-wrap">${message}</td></tr>`
    : "";
  const emailRow = email
    ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top;padding-right:16px">Email</td><td style="padding:8px 0;font-size:13px"><a href="mailto:${email}" style="color:#1f5f8e">${email}</a></td></tr>`
    : "";

  await client().emails.send({
    from: FROM,
    to: "hello@packmetrix.com",
    ...(replyTo ? { replyTo } : {}),
    subject: `Demo request: ${name} — ${agencyName}`,
    html: `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0d1b2e">
  <h2 style="font-size:18px;font-weight:700;margin:0 0 6px">New demo request</h2>
  <p style="color:#888;font-size:12px;margin:0 0 24px">Submitted via packmetrix.com · source: demo_request</p>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#666;font-size:13px;padding-right:16px;vertical-align:top">Name</td><td style="padding:8px 0;font-size:13px;font-weight:600;color:#0d1b2e">${name}</td></tr>
    <tr><td style="padding:8px 0;color:#666;font-size:13px;padding-right:16px;vertical-align:top">Agency</td><td style="padding:8px 0;font-size:13px;color:#0d1b2e">${agencyName}</td></tr>
    <tr><td style="padding:8px 0;color:#666;font-size:13px;padding-right:16px;vertical-align:top">WhatsApp</td><td style="padding:8px 0;font-size:13px"><a href="https://wa.me/${whatsapp.replace(/[^\d+]/g, "")}" style="color:#25d366;font-weight:600">${whatsapp}</a></td></tr>
    ${emailRow}
    ${messageRow}
  </table>
</div>`,
  });
}

export async function sendDomainFailedEmail(opts: {
  to: string;
  hostname: string;
  errorMessage?: string;
}): Promise<void> {
  if (!IS_PRODUCTION) return;
  const { to, hostname, errorMessage } = opts;
  await client().emails.send({
    from: FROM,
    to,
    subject: `Domain setup issue: ${hostname}`,
    html: `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0d1b2e">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">Domain verification failed</h2>
  <p style="color:#555;margin:0 0 16px">We couldn't activate <strong>${hostname}</strong>.${errorMessage ? ` Reason: ${errorMessage}` : ""}</p>
  <p style="color:#555;margin:0 0 8px"><strong>Common causes:</strong></p>
  <ul style="color:#555;margin:0 0 24px;padding-left:20px;line-height:1.8">
    <li>DNS records were not added, have a typo, or were deleted</li>
    <li>The domain is already pointing to a different service (conflict)</li>
    <li>Verification timed out after 48 hours</li>
  </ul>
  <p style="color:#555;margin:0 0 24px">Remove this domain from your <a href="https://packmetrix.com/profile" style="color:#1f5f8e">profile page</a> and try again, or reply to this email and we'll help you troubleshoot.</p>
  <p style="color:#888;font-size:12px;margin:0">The Packmetrix team</p>
</div>`,
  });
}
