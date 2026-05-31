import { useState, useEffect, useLayoutEffect } from "react";

// useLayoutEffect runs before the browser paints, useEffect runs after.
// On the server there is no window, so we fall back to useEffect (which
// is a no-op on the server anyway). This prevents the SSR warning while
// still switching to the correct mobile layout before the first paint on
// the client — avoiding a visible desktop→mobile flash on back-navigation.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}
