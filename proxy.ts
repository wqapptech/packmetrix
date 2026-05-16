import { NextRequest, NextResponse } from "next/server";

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "packmetrics-77450";
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

// In-process cache: domain → agencySlug | null, with expiry
const domainCache = new Map<string, { slug: string | null; exp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Domains that belong to packmetrix infrastructure — always pass through
function isInfrastructureHost(hostname: string): boolean {
  return (
    !hostname ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("packmetrix") ||
    hostname.includes("packmetrics") ||
    hostname.includes("firebase") ||
    hostname.includes("hosted.app") ||
    hostname.includes("vercel") ||
    hostname.includes("run.app") ||    // Cloud Run internal URLs
    hostname.includes("cloudfunctions") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) // raw IP addresses
  );
}

// NOTE: The `customDomains` Firestore collection must have a public read rule:
//   match /customDomains/{domain} { allow read: if true; }
// Writes are always done server-side via Firebase Admin (bypasses rules).
async function resolveCustomDomain(host: string): Promise<string | null> {
  const now = Date.now();
  const cached = domainCache.get(host);
  if (cached && cached.exp > now) return cached.slug;

  try {
    const firestoreUrl =
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
      `/databases/(default)/documents/customDomains/${encodeURIComponent(host)}` +
      (FIREBASE_API_KEY ? `?key=${FIREBASE_API_KEY}` : "");

    const res = await fetch(firestoreUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      domainCache.set(host, { slug: null, exp: now + CACHE_TTL_MS });
      return null;
    }

    const data = await res.json();
    const slug: string | null = data?.fields?.agencySlug?.stringValue ?? null;
    domainCache.set(host, { slug, exp: now + CACHE_TTL_MS });
    return slug;
  } catch {
    return null; // don't cache errors — allow retry on next request
  }
}

export async function proxy(request: NextRequest) {
  // X-Forwarded-Host is the reliable source of the external hostname on Firebase / Cloud Run.
  // Fall back to Host only if X-Forwarded-Host is absent.
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const hostname = rawHost.split(":")[0].toLowerCase();

  // Always pass through for packmetrix infrastructure domains
  if (isInfrastructureHost(hostname)) {
    return NextResponse.next();
  }

  // This is a custom agency domain — look it up in Firestore
  const agencySlug = await resolveCustomDomain(hostname);

  if (!agencySlug) {
    // Domain not registered or lookup failed.
    // Pass through so the visitor sees the packmetrix app (homepage / 404),
    // which is the natural fallback without risking redirect loops.
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  // If the path already starts with /{agencySlug}, serve it directly — no double-prefix.
  if (pathname === `/${agencySlug}` || pathname.startsWith(`/${agencySlug}/`)) {
    return NextResponse.next();
  }

  // Rewrite: keep the browser URL as the custom domain but route internally to
  // /{agencySlug}/... so Next.js serves the correct [agencySlug] pages.
  const url = request.nextUrl.clone();
  url.pathname = `/${agencySlug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|ingest).*)"],
};
