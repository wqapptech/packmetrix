/**
 * Cloudflare Worker — custom domain proxy for Packmetrix
 *
 * Intercepts requests arriving on agency custom domains (e.g. packages.client.com)
 * and forwards them to the Firebase App Hosting origin with the correct SNI/Host
 * header so TLS handshakes succeed.  The original hostname is passed to the app
 * via X-Tenant-Domain, authenticated with X-Proxy-Secret so the app can trust it.
 *
 * Deploy on the Cloudflare zone that handles fallback traffic for CF for-SaaS hostnames.
 * Route pattern: *.<zone>/* (or per-hostname routes via Workers Routes in the dashboard).
 *
 * Required Worker env vars:
 *   PROXY_SECRET — random string, must match PROXY_SECRET in App Hosting Secret Manager
 */

const APP_HOSTING_ORIGIN = "packmetrix--packmetrics-77450.europe-west4.hosted.app";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const tenantDomain = request.headers.get("host") ?? url.hostname;

    url.hostname = APP_HOSTING_ORIGIN;
    url.protocol = "https:";
    url.port = "";

    const headers = new Headers(request.headers);
    headers.set("host", APP_HOSTING_ORIGIN);
    headers.set("x-tenant-domain", tenantDomain);
    headers.set("x-proxy-secret", env.PROXY_SECRET);

    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
      redirect: "manual",
    });

    try {
      return await fetch(newRequest);
    } catch {
      return new Response("Bad gateway", { status: 502 });
    }
  },
};
