import { db } from "./firebase-admin";
import type { CFCustomHostname } from "./cloudflare";

export type DomainStatus =
  | "pending_dns"
  | "verifying"
  | "ssl_provisioning"
  | "active"
  | "failed";

export interface DnsRecord {
  type: "CNAME" | "TXT";
  name: string;
  value: string;
}

export interface StoredDomain {
  hostname: string;
  cf_hostname_id: string;
  status: DomainStatus;
  verification_records: DnsRecord[];
  ssl_records: DnsRecord[];
  error_message: string;
  created_at: number;
  updated_at: number;
}

export function mapCFStatus(cf: CFCustomHostname): DomainStatus {
  const hostStatus = cf.status;
  const sslStatus = cf.ssl?.status ?? "";

  if (hostStatus === "active" && sslStatus === "active") return "active";
  if (hostStatus === "active") return "ssl_provisioning";
  if (hostStatus === "moved") return "failed";
  if (["validation_timed_out", "expired_certificate", "blocked"].includes(sslStatus)) {
    return "failed";
  }
  if (["pending_validation", "pending_issuance", "pending_deployment"].includes(sslStatus)) {
    return "verifying";
  }
  return "pending_dns";
}

export function extractDnsRecords(cf: CFCustomHostname): {
  verification_records: DnsRecord[];
  ssl_records: DnsRecord[];
} {
  const verification_records: DnsRecord[] = [];
  const ssl_records: DnsRecord[] = [];

  if (cf.ownership_verification) {
    verification_records.push({
      type: "TXT",
      name: cf.ownership_verification.name,
      value: cf.ownership_verification.value,
    });
  }

  for (const r of cf.ssl?.validation_records ?? []) {
    if (r.txt_name && r.txt_value) {
      ssl_records.push({ type: "TXT", name: r.txt_name, value: r.txt_value });
    }
  }

  return { verification_records, ssl_records };
}

// Single function that keeps the user doc and public routing index in sync.
// Call this on every domain state change — never write to either collection directly.
export async function upsertDomainState(
  userId: string,
  agencySlug: string,
  domain: StoredDomain
): Promise<void> {
  const now = Date.now();
  const batch = db.batch();

  batch.update(db.collection("users").doc(userId), {
    customDomain: domain.hostname,
    customDomainCfId: domain.cf_hostname_id,
    customDomainStatus: domain.status,
    customDomainVerificationRecords: domain.verification_records,
    customDomainSslRecords: domain.ssl_records,
    customDomainError: domain.error_message,
    customDomainCreatedAt: domain.created_at,
    customDomainUpdatedAt: now,
  });

  batch.set(db.collection("customDomains").doc(domain.hostname), {
    agencySlug,
    userId,
    cf_hostname_id: domain.cf_hostname_id,
    status: domain.status,
    updatedAt: now,
  });

  await batch.commit();
}

// Clears all domain state from the user doc and removes the routing index entry.
export async function clearDomainState(
  userId: string,
  hostname: string
): Promise<void> {
  const batch = db.batch();

  batch.update(db.collection("users").doc(userId), {
    customDomain: null,
    customDomainCfId: null,
    customDomainStatus: null,
    customDomainVerificationRecords: [],
    customDomainSslRecords: [],
    customDomainError: null,
    customDomainCreatedAt: null,
    customDomainUpdatedAt: Date.now(),
  });

  batch.delete(db.collection("customDomains").doc(hostname));

  await batch.commit();
}
