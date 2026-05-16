import { NextRequest, NextResponse } from "next/server";

// Hosts that should pass through without custom-domain routing
const PASSTHROUGH_HOSTS = new Set([
  "packmetrix.com",
  "www.packmetrix.com",
  "localhost",
  "127.0.0.1",
]);

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "packmetrics-77450";
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

// In-process cache: domain → agencySlug | null, with expiry
// Lives in the proxy isolate memory; survives warm requests, resets on cold start.
const domainCache = new Map<string, { slug: string | null; exp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// NOTE: The `customDomains` Firestore collection must have a public read rule:
//   match /customDomains/{domain} { allow read: if true; }
// Writes are always done via Firebase Admin (server-side, bypasses rules).
async function resolveCustomDomain(host: string): Promise<string | null> {
  const now = Date.now();
  const cached = domainCache.get(host);
  if (cached && cached.exp > now) return cached.slug;

  try {
    const encodedHost = encodeURIComponent(host);
    const firestoreUrl =
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
      `/databases/(default)/documents/customDomains/${encodedHost}` +
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
    // Network / parse error — don't cache, allow retry on next request
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const rawHost = request.headers.get("host") ?? "";
  const hostname = rawHost.split(":")[0];

  // Let requests on the main packmetrix domain and known infra hosts pass through
  if (
    PASSTHROUGH_HOSTS.has(hostname) ||
    hostname.endsWith(".packmetrix.com") ||
    hostname.endsWith(".firebaseapp.com") ||
    hostname.endsWith(".web.app") ||
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".localhost")
  ) {
    return NextResponse.next();
  }

  const agencySlug = await resolveCustomDomain(hostname);

  if (!agencySlug) {
    // Domain not registered or lookup failed → redirect to main domain
    return NextResponse.redirect("https://packmetrix.com");
  }

  const pathname = request.nextUrl.pathname;

  // If the path already starts with /{agencySlug} (e.g. a client-side navigation
  // that already has the full route), serve it directly — no double-prefix.
  if (pathname === `/${agencySlug}` || pathname.startsWith(`/${agencySlug}/`)) {
    return NextResponse.next();
  }

  // Rewrite: keep the browser URL as the custom domain but internally route to
  // /{agencySlug}/... so Next.js serves the correct [agencySlug] pages.
  const url = request.nextUrl.clone();
  url.pathname = `/${agencySlug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next.js internals, static assets, API routes, and PostHog ingest proxy
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|ingest).*)"],
};
