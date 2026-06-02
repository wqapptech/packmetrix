// Scheduled by GCP Cloud Scheduler — see setup instructions at the bottom of this file.
//
// Cloud Scheduler job config:
//   Name:        poll-domains-5min
//   Frequency:   */5 * * * *   (every 5 minutes)
//   Target:      HTTP  POST  https://packmetrix.com/api/cron/poll-domains
//   Headers:     X-Cron-Secret: <value of CRON_SECRET env var>
//   Body:        (empty)
//   Retry:       0 retries  (next run will catch any missed domains)

import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { db, adminAuth } from "@/lib/firebase-admin";
import { getAppHostingDomain } from "@/lib/app-hosting";
import {
  mapAppHostingStatus,
  upsertDomainState,
  type DomainStatus,
  type DnsRecord,
} from "@/lib/domain-sync";
import {
  sendDomainActiveEmail,
  sendDomainFailedEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

// Statuses that are in-flight at the App Hosting API level and need polling.
// "requested" is excluded — the domain hasn't been added to App Hosting yet.
const PENDING_STATUSES: DomainStatus[] = ["records_ready", "verifying"];

const FOUR_MIN_MS        = 4  * 60 * 1000;
const FIFTY_FIVE_MIN_MS  = 55 * 60 * 1000;
const H24_MS             = 24 * 60 * 60 * 1000;
const H48_MS             = 48 * 60 * 60 * 1000;

// Constant-time secret comparison — hashing normalises length before timingSafeEqual.
function isValidCronSecret(provided: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !provided) return false;
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(provided).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!isValidCronSecret(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();

  const snap = await db
    .collection("users")
    .where("customDomainStatus", "in", PENDING_STATUSES)
    .get();

  const summary = { polled: 0, timed_out: 0, skipped: 0, errors: 0 };

  for (const doc of snap.docs) {
    const data       = doc.data();
    const hostname   = (data.customDomain        as string | null) ?? null;
    const createdAt  = (data.customDomainCreatedAt as number | null) ?? now;
    const updatedAt  = (data.customDomainUpdatedAt as number | null) ?? now;
    const prevStatus = data.customDomainStatus as DomainStatus;
    const dnsRecords: DnsRecord[] = data.customDomainDnsRecords ?? [];
    const agencySlug: string = data.agencySlug || data.name || doc.id;

    if (!hostname) { summary.skipped++; continue; }

    const ageMs         = now - createdAt;
    const sinceUpdateMs = now - updatedAt;

    // ── 48h timeout ────────────────────────────────────────────────────────────
    if (ageMs > H48_MS) {
      await upsertDomainState(doc.id, agencySlug, {
        hostname,
        status: "failed",
        dns_records: dnsRecords,
        error_message: "Domain verification timed out after 48 hours.",
        created_at: createdAt,
        updated_at: now,
      });
      try {
        const userRecord = await adminAuth.getUser(doc.id);
        if (userRecord.email) {
          await sendDomainFailedEmail({
            to: userRecord.email,
            hostname,
            errorMessage: "Domain verification timed out after 48 hours.",
          });
        }
      } catch { /* email failure must not abort the batch */ }
      summary.timed_out++;
      continue;
    }

    // ── Cadence gates ──────────────────────────────────────────────────────────
    // 24h–48h band: drop to hourly polling.
    if (ageMs > H24_MS && sinceUpdateMs < FIFTY_FIVE_MIN_MS) {
      summary.skipped++;
      continue;
    }
    // Under 24h: skip if already processed within the last 4 min to prevent
    // double-polling from overlapping Cloud Scheduler runs.
    if (ageMs <= H24_MS && sinceUpdateMs < FOUR_MIN_MS) {
      summary.skipped++;
      continue;
    }

    // ── Poll Firebase App Hosting ──────────────────────────────────────────────
    try {
      const result = await getAppHostingDomain(hostname);

      if (!result) {
        // 403 — service account lacks IAM role; don't fail, just skip this tick.
        summary.skipped++;
        continue;
      }

      const newStatus = mapAppHostingStatus(result.hostState, result.certState);

      // null means status is ambiguous (domain not yet in App Hosting, or still
      // waiting for DNS propagation) — update updatedAt to reset cadence gate but
      // keep existing status.
      const effectiveStatus: DomainStatus = newStatus ?? prevStatus;
      const errorMessage = newStatus === "failed"
        ? `Host: ${result.hostState}, Cert: ${result.certState}`
        : "";

      await upsertDomainState(doc.id, agencySlug, {
        hostname,
        status: effectiveStatus,
        dns_records: dnsRecords,
        error_message: errorMessage,
        created_at: createdAt,
        updated_at: now,
      });

      // Send transition emails.
      try {
        if (prevStatus !== "active" && effectiveStatus === "active") {
          const userRecord = await adminAuth.getUser(doc.id);
          if (userRecord.email) {
            await sendDomainActiveEmail({ to: userRecord.email, hostname });
          }
        } else if (prevStatus !== "failed" && effectiveStatus === "failed") {
          const userRecord = await adminAuth.getUser(doc.id);
          if (userRecord.email) {
            await sendDomainFailedEmail({ to: userRecord.email, hostname, errorMessage });
          }
        }
      } catch { /* email failure must not abort the batch */ }

      summary.polled++;
    } catch {
      // Don't abort the batch on a single API failure; next run will retry.
      summary.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}
