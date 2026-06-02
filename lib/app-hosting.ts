// Server-only — never import from client components.
// Calls the Firebase App Hosting REST API using the same service-account
// credentials already loaded for firebase-admin (FIREBASE_ADMIN_KEY).
// google-auth-library ships with firebase-admin; no extra install needed.

import { GoogleAuth } from "google-auth-library";

const SCOPE = "https://www.googleapis.com/auth/cloud-platform";

// Full resource prefix: "projects/{id}/locations/{loc}/backends/{backendId}"
// Set FIREBASE_APP_HOSTING_BACKEND_NAME in apphosting.yaml / .env.local.
const BACKEND_NAME = process.env.FIREBASE_APP_HOSTING_BACKEND_NAME;

export interface AppHostingDomainState {
  hostState: string;
  certState: string;
}

function makeAuth(): GoogleAuth {
  const keyStr = process.env.FIREBASE_ADMIN_KEY;
  if (!keyStr) throw new Error("FIREBASE_ADMIN_KEY is not set");
  const key = JSON.parse(keyStr);
  key.private_key = key.private_key.replace(/\\n/g, "\n");
  return new GoogleAuth({ credentials: key, scopes: [SCOPE] });
}

/**
 * Fetches the domain resource from the Firebase App Hosting REST API.
 *
 * Returns:
 *  - AppHostingDomainState  — on success
 *  - null                   — on 403 (service account lacks IAM role); caller
 *                             should leave the existing Firestore status unchanged
 *                             and retry on the next cron tick
 *
 * Special case: 404 returns { hostState: "HOST_NOT_FOUND", certState: "CERT_STATE_UNSPECIFIED" }
 * meaning the admin hasn't added the domain to App Hosting yet.
 *
 * Throws on unexpected errors so the cron can log them.
 */
export async function getAppHostingDomain(
  hostname: string
): Promise<AppHostingDomainState | null> {
  if (!BACKEND_NAME) {
    throw new Error("FIREBASE_APP_HOSTING_BACKEND_NAME is not set");
  }

  let token: string;
  try {
    const auth = makeAuth();
    const t = await auth.getAccessToken();
    if (!t) throw new Error("empty token");
    token = t;
  } catch (err) {
    throw new Error(`App Hosting auth failed: ${(err as Error).message}`);
  }

  const url =
    `https://firebaseapphosting.googleapis.com/v1beta/` +
    `${BACKEND_NAME}/domains/${encodeURIComponent(hostname)}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
    throw new Error(`App Hosting API network error: ${(err as Error).message}`);
  }

  if (res.status === 404) {
    return { hostState: "HOST_NOT_FOUND", certState: "CERT_STATE_UNSPECIFIED" };
  }

  if (res.status === 403) {
    // IAM permission missing — don't fail the cron; let admin know via logs
    return null;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`App Hosting API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const body = await res.json() as {
    hostState?: string;
    certState?: string;
  };

  return {
    hostState: body.hostState ?? "HOST_STATE_UNSPECIFIED",
    certState: body.certState ?? "CERT_STATE_UNSPECIFIED",
  };
}
