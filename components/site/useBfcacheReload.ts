"use client";

import { useEffect } from "react";

const STUCK_KEY = "pmx_stuck_reload";

/**
 * Mechanism-agnostic safety net for the "stuck loading spinner" after a
 * Back/Forward navigation (most often Chrome's bfcache freezing the Firestore
 * connection, so the read never settles and `finally { setLoading(false) }`
 * never runs).
 *
 * If `loading` is still true after `timeoutMs`, force a fresh reload — which is
 * what a manual refresh does. A frozen Firestore connection doesn't always clear
 * on a single in-place reload, so we allow up to `maxReloads` consecutive
 * attempts before giving up. A sessionStorage counter bounds this so a fetch
 * that hangs on EVERY load can't reload-loop forever; the counter is cleared the
 * moment a load completes (loading → false), so each new stuck episode starts
 * fresh. (The earlier one-shot guard made a stuck restore permanent when the
 * first reload also landed on a hung load.)
 */
export function useReloadIfStuck(loading: boolean, timeoutMs: number = 4000, maxReloads: number = 3): void {
  useEffect(() => {
    if (!loading) {
      // A successful (or settled) load — arm the net again for the next episode.
      try { sessionStorage.removeItem(STUCK_KEY); } catch {}
      return;
    }
    const t = setTimeout(() => {
      try {
        const tries = Number(sessionStorage.getItem(STUCK_KEY) || "0");
        console.log("[PMX-DIAG] stuck-timer fired after", timeoutMs, "ms; reload tries so far =", tries);
        if (tries >= maxReloads) { console.log("[PMX-DIAG] stuck-timer giving up (maxReloads reached)"); return; }
        sessionStorage.setItem(STUCK_KEY, String(tries + 1));
      } catch {}
      window.location.reload();
    }, timeoutMs);
    return () => clearTimeout(t);
  }, [loading, timeoutMs, maxReloads]);
}

/**
 * Force a fresh load when the user returns to a public page via the browser
 * Back/Forward button.
 *
 * The public site is an MPA: pages navigate with hard `window.location` links
 * and fetch their data client-side with the Firestore SDK. On a Back/Forward,
 * the page is NOT loaded fresh — either the browser restores it from the
 * back/forward cache (bfcache), or Next's App Router soft-restores the cached
 * render on `popstate`. In both cases our load effect doesn't re-run against a
 * live Firestore connection, so the page is stuck on its loading spinner. A
 * manual refresh fixes it — so we trigger that refresh automatically.
 *
 * - `pageshow` + `event.persisted` → a bfcache restore.
 * - `popstate` → a Back/Forward history navigation the router would otherwise
 *   handle softly.
 *
 * `reload()` is a fresh load (not a Back/Forward), so neither handler can loop.
 * Forward navigation via plain links is unaffected (no popstate, no persisted
 * pageshow).
 *
 * @param enabled  Pass false to disable (e.g. the dashboard builder preview,
 *                 where a reload would be disruptive). Defaults to true.
 */
export function useBfcacheReload(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;
    try {
      const navType = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
      console.log("[PMX-DIAG] bfcache listeners attached; navigation type =", navType);
    } catch {}
    const reload = (from: string) => { console.log("[PMX-DIAG] reload() triggered by", from); window.location.reload(); };
    const onPageShow = (e: PageTransitionEvent) => { console.log("[PMX-DIAG] pageshow persisted =", e.persisted); if (e.persisted) reload("pageshow.persisted"); };
    const onPopState = () => reload("popstate");
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPopState);
    return () => {
      console.log("[PMX-DIAG] bfcache listeners REMOVED (component unmounting)");
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled]);
}
