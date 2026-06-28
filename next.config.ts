import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allows an isolated build/dev output dir (e.g. PM_DIST_DIR=.next-verify) so a
  // verification server can run alongside the main dev server without clobbering
  // its .next. Defaults to the standard ".next".
  distDir: process.env.PM_DIST_DIR || ".next",
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
