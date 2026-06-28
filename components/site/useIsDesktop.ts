"use client";

import { useEffect, useState } from "react";

/** Site-chrome breakpoint: desktop ≥ 880px (full nav + footer columns). */
export function useIsDesktop(query = "(min-width: 880px)") {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return desktop;
}
