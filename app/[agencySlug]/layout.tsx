// Storefront route group layout.
//
// Public storefront pages are an MPA that fetch their data client-side with the
// Firestore SDK. On a Back/Forward navigation the page's React tree does NOT
// re-hydrate / re-run effects (the server-rendered `loading` spinner is shown
// but the effect that would clear it never runs) — so the page hangs on its
// spinner until a manual refresh. Because React effects don't run in that state,
// the recovery must happen BEFORE React, as an inline document script.
//
// The script forces one fresh load when the document was reached via:
//   • a Back/Forward history navigation  → performance navigation type
//     'back_forward' (a real document load that didn't hydrate), or
//   • a bfcache restore                  → `pageshow` with `persisted === true`.
// Both are self-terminating: a `location.reload()` produces navigation type
// 'reload' (not 'back_forward') and a non-persisted pageshow, so neither path
// can loop. This layout only wraps `/[agencySlug]/*` public routes — the
// dashboard/builder SPA is unaffected.

const BFCACHE_RELOAD = `
(function () {
  try {
    var nav = performance.getEntriesByType("navigation")[0];
    console.log("[PMX-DIAG] doc-script navType =", nav && nav.type);
    if (nav && nav.type === "back_forward") { console.log("[PMX-DIAG] doc-script reloading (back_forward)"); window.location.reload(); return; }
  } catch (e) {}
  try {
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { console.log("[PMX-DIAG] doc-script reloading (pageshow.persisted)"); window.location.reload(); }
    });
  } catch (e) {}
})();
`.trim();

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: BFCACHE_RELOAD }} />
      {children}
    </>
  );
}
