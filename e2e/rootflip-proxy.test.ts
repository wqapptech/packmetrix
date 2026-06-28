/**
 * Adversarial unit tests for the root-flip proxy + gate (no server needed).
 * Asserts proxy() routing per (host, path) and resolveSiteMode() kill-switch.
 *   Run: npx tsx e2e/rootflip-proxy.test.ts
 */
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

let pass = 0, fail = 0;
function ok(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}

function run(host: string, path: string) {
  const req = new NextRequest(new URL(path, "http://localhost:3000"), { headers: { host } });
  const res = proxy(req);
  return {
    status: res.status,
    next: res.headers.get("x-middleware-next") === "1",
    rewrite: res.headers.get("x-middleware-rewrite"),
  };
}
const rewroteTo = (r: ReturnType<typeof run>, p: string) => !!r.rewrite && new URL(r.rewrite).pathname === p;

console.log("PROXY — custom agency domain (clientdomain.com)");
ok("/packages → tenant storefront (NOT 404, NOT dashboard)", rewroteTo(run("clientdomain.com", "/packages"), "/sites/clientdomain.com/packages"), JSON.stringify(run("clientdomain.com", "/packages")));
ok("/home → tenant homepage", rewroteTo(run("clientdomain.com", "/home"), "/sites/clientdomain.com/home"));
ok("/ → tenant root", rewroteTo(run("clientdomain.com", "/"), "/sites/clientdomain.com"));
ok("/<packageId> share still resolves", rewroteTo(run("clientdomain.com", "/abc123"), "/sites/clientdomain.com/abc123"));
ok("/login still BLOCKED (404)", run("clientdomain.com", "/login").status === 404);
ok("/dashboard still BLOCKED (404)", run("clientdomain.com", "/dashboard").status === 404);
ok("/profile still BLOCKED (404)", run("clientdomain.com", "/profile").status === 404);

console.log("PROXY — slug subdomain (acme.packmetrix.com)");
ok("/packages → tenant storefront (NOT app dashboard)", rewroteTo(run("acme.packmetrix.com", "/packages"), "/acme/packages"), JSON.stringify(run("acme.packmetrix.com", "/packages")));
ok("/home → tenant homepage", rewroteTo(run("acme.packmetrix.com", "/home"), "/acme/home"));
ok("/ → tenant root", rewroteTo(run("acme.packmetrix.com", "/"), "/acme"));
ok("/<packageId> share still resolves", rewroteTo(run("acme.packmetrix.com", "/abc123"), "/acme/abc123"));
ok("/dashboard still passes through to app (unchanged)", run("acme.packmetrix.com", "/dashboard").next);
ok("/builder still passes through to app (unchanged)", run("acme.packmetrix.com", "/builder").next);

console.log("PROXY — portal & admin (must be UNCHANGED)");
ok("agency. /packages → app dashboard (next, unchanged)", run("agency.packmetrix.com", "/packages").next);
ok("agency. /dashboard → app (next)", run("agency.packmetrix.com", "/dashboard").next);
ok("agency. / → /dashboard rewrite", rewroteTo(run("agency.packmetrix.com", "/"), "/dashboard"));
ok("admin. /foo → /admin/foo rewrite", rewroteTo(run("admin.packmetrix.com", "/foo"), "/admin/foo"));

console.log("GATE — resolveSiteMode kill-switch");
// Imported lazily so process.env is read at call time.
const { resolveSiteMode } = require("../lib/site-mode");
delete process.env.ROOT_FLIP_ENABLED;
ok("flag OFF: site-mode agency → catalog (kill-switch)", resolveSiteMode({ siteMode: "site" }) === "catalog");
ok("flag OFF: null doc → catalog", resolveSiteMode(null) === "catalog");
process.env.ROOT_FLIP_ENABLED = "true";
ok("flag ON: siteMode 'site' → site", resolveSiteMode({ siteMode: "site" }) === "site");
ok("flag ON: siteMode absent → site (default)", resolveSiteMode({}) === "site");
ok("flag ON: null doc → site (default)", resolveSiteMode(null) === "site");
ok("flag ON: siteMode 'catalog' → catalog (explicit opt-out)", resolveSiteMode({ siteMode: "catalog" }) === "catalog");
delete process.env.ROOT_FLIP_ENABLED;

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
