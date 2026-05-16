import { NextRequest, NextResponse } from "next/server";

const AGENCY_HOSTNAMES = ["agency.packmetrix.com"];

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // On the agency subdomain, redirect bare / to /dashboard
  if (AGENCY_HOSTNAMES.some((h) => hostname.includes(h))) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
