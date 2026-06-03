import { NextRequest, NextResponse } from "next/server";

// Paths that must never be served on a custom agency domain.
// Auth and app-management routes stay on packmetrix.com only.
const BLOCKED_ON_CUSTOM_DOMAIN = [
  "/login", "/signup", "/dashboard", "/builder", "/profile",
  "/leads", "/packages", "/paywall", "/home", "/admin",
];

// App routes that should always pass through on the agency portal subdomain.
const APP_ROOTS = [
  "/dashboard", "/builder", "/login", "/signup", "/profile",
  "/leads", "/packages", "/paywall", "/home", "/api", "/_next",
  "/ingest", "/sites",
];

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
    hostname.includes("run.app") ||
    hostname.includes("cloudfunctions") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  );
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Host resolution ────────────────────────────────────────────────────────
  // X-Packmetrix-Host lets local dev simulate a custom domain without real DNS.
  // e.g. curl -H "X-Packmetrix-Host: packages.client.com" http://localhost:3000/
  const devOverride = request.headers.get("x-packmetrix-host");

  const rawHost =
    devOverride ||
    request.headers.get("x-tenant-domain") ||
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const hostname = rawHost.split(",")[0].trim().split(":")[0].toLowerCase();

  // ── Agency portal subdomain ────────────────────────────────────────────────
  if (hostname === "agency.packmetrix.com") {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.rewrite(url);
    }
    if (pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.rewrite(url);
    }
    if (APP_ROOTS.some(r => pathname === r || pathname.startsWith(r + "/"))) {
      return NextResponse.next();
    }
    // Single-segment path → treat as a package share URL for the "agency" slug.
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 1) {
      const url = request.nextUrl.clone();
      url.pathname = `/agency/${segments[0]}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ── Admin subdomain ────────────────────────────────────────────────────────
  if (hostname === "admin.packmetrix.com") {
    if (!pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ── All *.packmetrix.com (slug subdomains + infra like proxy/cname/www) ───
  if (hostname.endsWith(".packmetrix.com")) {
    const slugSubdomain = hostname.match(/^([a-z0-9-]+)\.packmetrix\.com$/);
    if (slugSubdomain) {
      const agencySlug = slugSubdomain[1];
      if (pathname === `/${agencySlug}` || pathname.startsWith(`/${agencySlug}/`)) {
        return NextResponse.next();
      }
      const url = request.nextUrl.clone();
      url.pathname = `/${agencySlug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ── Non-packmetrix infrastructure (localhost, IPs, firebase, run.app…) ────
  if (isInfrastructureHost(hostname)) {
    return NextResponse.next();
  }

  // ── Custom agency domain ───────────────────────────────────────────────────
  // Block auth and app-management paths — these must stay on packmetrix.com.
  const isBlocked = BLOCKED_ON_CUSTOM_DOMAIN.some(
    r => pathname === r || pathname.startsWith(r + "/")
  );
  if (isBlocked) {
    return new NextResponse(null, { status: 404 });
  }

  // Rewrite to the tenant route. The _sites page resolves the host → agencySlug
  // via Firestore (server-side, Admin SDK) and serves the published content.
  // The browser URL stays as the custom domain — no redirect.
  const url = request.nextUrl.clone();
  url.pathname = `/sites/${hostname}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|ingest|.*\\.[^/]+$).*)"],
};
