import { db } from "./firebase-admin";

export type DomainStatus =
  | "requested"       // agency submitted; admin must add to App Hosting + paste records
  | "records_ready"   // admin entered records; agency must add to their registrar
  | "verifying"       // App Hosting sees the records; cert provisioning in progress
  | "active"          // HOST_ACTIVE + CERT_ACTIVE; domain is live
  | "failed";         // timeout, HOST_CONFLICT, or CERT_ISSUE_FAILED

export interface DnsRecord {
  type: "A" | "AAAA" | "CNAME" | "TXT";
  name: string;
  value: string;
}

export interface StoredDomain {
  hostname: string;
  status: DomainStatus;
  dns_records: DnsRecord[];  // records admin pastes after adding to App Hosting
  error_message: string;
  created_at: number;
  updated_at: number;
}

// Maps App Hosting host/cert states to our DomainStatus.
// Returns null when status is ambiguous (permission error, domain not yet added)
// so the caller can leave the existing status unchanged.
export function mapAppHostingStatus(
  hostState: string,
  certState: string
): DomainStatus | null {
  if (
    hostState === "HOST_CONFLICT" ||
    certState === "CERT_EXPIRED" ||
    certState === "CERT_ISSUE_FAILED"
  ) {
    return "failed";
  }
  if (hostState === "HOST_ACTIVE" && certState === "CERT_ACTIVE") {
    return "active";
  }
  if (hostState === "HOST_ACTIVE") {
    return "verifying";
  }
  if (hostState === "HOST_MISMATCH") {
    return "failed";
  }
  // HOST_UNVERIFIED, HOST_NOT_FOUND, HOST_STATE_UNSPECIFIED — still waiting
  return null;
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
    customDomainStatus: domain.status,
    customDomainDnsRecords: domain.dns_records,
    customDomainError: domain.error_message,
    customDomainCreatedAt: domain.created_at,
    customDomainUpdatedAt: now,
  });

  batch.set(db.collection("customDomains").doc(domain.hostname), {
    agencySlug,
    userId,
    status: domain.status,
    dns_records: domain.dns_records,
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
    customDomainStatus: null,
    customDomainDnsRecords: [],
    customDomainError: null,
    customDomainCreatedAt: null,
    customDomainUpdatedAt: Date.now(),
  });

  batch.delete(db.collection("customDomains").doc(hostname));

  await batch.commit();
}
