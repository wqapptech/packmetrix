// Server-only — never import from client components.
// Reads credentials from env at call time so they are never captured at module init.

const CF_BASE = "https://api.cloudflare.com/client/v4";

export interface CFSslValidationRecord {
  txt_name?: string;
  txt_value?: string;
  cname?: string;
  cname_target?: string;
}

export interface CFSsl {
  id?: string;
  type?: string;
  method?: string;
  status?: string;
  validation_errors?: { message: string }[];
  validation_records?: CFSslValidationRecord[];
  settings?: { min_tls_version?: string };
}

export interface CFOwnershipVerification {
  type: "txt";
  name: string;
  value: string;
}

export interface CFCustomHostname {
  id: string;
  hostname: string;
  status: string;
  ownership_verification?: CFOwnershipVerification;
  ownership_verification_http?: { http_url: string; http_body: string };
  ssl?: CFSsl;
  created_at?: string;
}

function credentials(): { zoneId: string; headers: Record<string, string> } {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!zoneId || !token) {
    throw new Error("CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN must be set");
  }
  return {
    zoneId,
    // Token is passed only in headers and never logged or returned.
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

async function cfFetch(url: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  // One retry on transient 5xx errors.
  if (res.status >= 500) {
    return fetch(url, init);
  }
  return res;
}

async function parseResult<T>(res: Response): Promise<T> {
  const body = await res.json() as { success: boolean; result?: T; errors?: { message: string }[] };
  if (!res.ok || !body.success) {
    const messages = (body.errors ?? []).map((e) => e.message).filter(Boolean);
    throw new Error(messages.length ? messages.join("; ") : `Cloudflare API error ${res.status}`);
  }
  return body.result as T;
}

export async function createCustomHostname(hostname: string): Promise<CFCustomHostname> {
  const { zoneId, headers } = credentials();
  const res = await cfFetch(`${CF_BASE}/zones/${zoneId}/custom_hostnames`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      hostname,
      ssl: {
        method: "http",
        type: "dv",
        settings: { min_tls_version: "1.2" },
      },
    }),
  });
  return parseResult<CFCustomHostname>(res);
}

export async function getCustomHostname(cfHostnameId: string): Promise<CFCustomHostname> {
  const { zoneId, headers } = credentials();
  const res = await cfFetch(
    `${CF_BASE}/zones/${zoneId}/custom_hostnames/${cfHostnameId}`,
    { method: "GET", headers },
  );
  return parseResult<CFCustomHostname>(res);
}

export async function deleteCustomHostname(cfHostnameId: string): Promise<void> {
  const { zoneId, headers } = credentials();
  const res = await cfFetch(
    `${CF_BASE}/zones/${zoneId}/custom_hostnames/${cfHostnameId}`,
    { method: "DELETE", headers },
  );
  // DELETE returns { id } on success, not a full result object — just assert HTTP ok.
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { errors?: { message: string }[] };
    const messages = (body.errors ?? []).map((e) => e.message).filter(Boolean);
    throw new Error(messages.length ? messages.join("; ") : `Cloudflare delete failed ${res.status}`);
  }
}
