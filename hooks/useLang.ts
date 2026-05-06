"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "packmetrix_lang";

export function useLang(): "en" | "ar" {
  const [lang, setLang] = useState<"en" | "ar">("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as "en" | "ar" | null;
    const bodyAttr = document.body.getAttribute("data-lang") as "en" | "ar" | null;
    const resolved: "en" | "ar" = stored === "ar" || bodyAttr === "ar" ? "ar" : "en";

    if (resolved !== "en" && !bodyAttr) {
      document.body.setAttribute("data-lang", resolved);
    }
    setLang(resolved);

    const obs = new MutationObserver(() => {
      const l = document.body.getAttribute("data-lang");
      setLang(l === "ar" ? "ar" : "en");
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-lang"] });
    return () => obs.disconnect();
  }, []);

  return lang;
}

export const LANG_STORAGE_KEY = STORAGE_KEY;
