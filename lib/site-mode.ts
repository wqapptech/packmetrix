// Root-flip gating — the safety mechanism for serving the homepage at "/".
//
// Two layers, both default to TODAY's behavior (storefront at root):
//   1. ROOT_FLIP_ENABLED (env, master kill-switch) — when not "true", EVERY
//      agency renders catalog at root regardless of their siteMode. Ship OFF.
//   2. users/{uid}.siteMode ("catalog" | "site") — per-agency setting. DEFAULT is
//      "site" (homepage at root, storefront at /packages); only an explicit
//      "catalog" opts back out to the storefront at root. Only honored when the
//      kill-switch is ON.
//
// Server-only (reads process.env); imported by the root/`/packages`/`/home`
// route components. NOT gated: the /packages routes themselves stay routable in
// catalog mode — they're just an extra path to the storefront, which is benign.

export type SiteMode = "catalog" | "site";

/** Master kill-switch. Defaults OFF: only "true" enables the root flip. */
export function rootFlipEnabled(): boolean {
  return process.env.ROOT_FLIP_ENABLED === "true";
}

/** Resolve the effective root surface for an agency document. */
export function resolveSiteMode(doc: Record<string, unknown> | null | undefined): SiteMode {
  if (!rootFlipEnabled()) return "catalog"; // kill-switch forces catalog for everyone
  // Default is "site" (homepage at root); only an explicit "catalog" opts out.
  return doc && (doc as { siteMode?: unknown }).siteMode === "catalog" ? "catalog" : "site";
}
