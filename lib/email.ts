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

export async function sendDomainAddedEmail(opts: {
  to: string;
  hostname: string;
  cnameRecord?: { name: string; value: string };
  verificationRecords: DnsRecord[];
  sslRecords: DnsRecord[];
}): Promise<void> {
  if (!IS_PRODUCTION) return;
  const { to, hostname, cnameRecord, verificationRecords, sslRecords } = opts;

  const allRecords = [
    ...(cnameRecord ? [{ type: "CNAME", name: cnameRecord.name, value: cnameRecord.value, purpose: "Route traffic" }] : []),
    ...verificationRecords.map(r => ({ ...r, purpose: "Ownership verification" })),
    ...sslRecords.map(r => ({ ...r, purpose: "SSL certificate" })),
  ];

  const recordRows = allRecords
    .map(r => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px 12px;font-size:12px;color:#666">${r.purpose}</td><td style="padding:8px 12px;font-size:12px;font-weight:600">${r.type}</td><td style="padding:8px 12px;font-family:monospace;font-size:11px">${r.name}</td><td style="padding:8px 12px;font-family:monospace;font-size:11px;word-break:break-all">${r.value}</td></tr>`)
    .join("");

  const apexNote = !cnameRecord
    ? `<div style="background:#fff8e7;border:1px solid #ffe082;border-radius:8px;padding:14px 16px;margin-bottom:24px;font-size:13px;color:#7a5c00"><strong>Apex domain note:</strong> Root domains (e.g. <strong>${hostname}</strong>) cannot use a plain CNAME record per the DNS spec. Your registrar must support CNAME flattening / ALIAS records, or you must add A records pointing to Cloudflare&apos;s IP addresses. Contact your registrar or email <a href="mailto:support@packmetrix.com" style="color:#1f5f8e">support@packmetrix.com</a> for help.</div>`
    : "";

  await client().emails.send({
    from: FROM,
    to,
    subject: `Action required: Add DNS records for ${hostname}`,
    html: `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0d1b2e">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">Your custom domain is registered</h2>
  <p style="color:#555;margin:0 0 24px">Add the following DNS records at your domain registrar to activate <strong>${hostname}</strong>. Changes can take up to 48 hours to propagate.</p>
  ${apexNote}

  <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;margin-bottom:24px">
    <thead>
      <tr style="background:#f7f7f7">
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#999">Purpose</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#999">Type</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#999">Name</th>
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#999">Value</th>
      </tr>
    </thead>
    <tbody>${recordRows}</tbody>
  </table>

  <p style="color:#555;margin:0 0 8px">We check your domain automatically every few minutes and will email you once it's live.</p>
  <p style="color:#888;font-size:12px;margin:0">You can also check the current status anytime from your <a href="https://app.packmetrix.com/profile" style="color:#1f5f8e">profile page</a>.</p>
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
  <p style="color:#555;margin:0 0 16px">We couldn't verify <strong>${hostname}</strong> after 48 hours.${errorMessage ? ` Reason: ${errorMessage}` : ""}</p>
  <p style="color:#555;margin:0 0 8px"><strong>Common causes:</strong></p>
  <ul style="color:#555;margin:0 0 24px;padding-left:20px;line-height:1.8">
    <li>DNS records were not added or have a typo</li>
    <li>A proxy (e.g. Cloudflare orange-cloud) is interfering with the CNAME</li>
    <li>Your registrar cached stale records</li>
  </ul>
  <p style="color:#555;margin:0 0 24px">You can remove this domain from your <a href="https://app.packmetrix.com/profile" style="color:#1f5f8e">profile page</a> and try again, or reply to this email and we'll help you troubleshoot.</p>
  <p style="color:#888;font-size:12px;margin:0">The Packmetrix team</p>
</div>`,
  });
}
