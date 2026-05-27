"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "packmetrix_lang";
const LANG_EVENT  = "packmetrix-lang-change";

export function useLang(): "en" | "ar" {
  const [lang, setLang] = useState<"en" | "ar">("en");

  useEffect(() => {
    const stored   = localStorage.getItem(STORAGE_KEY) as "en" | "ar" | null;
    const bodyAttr = document.body.getAttribute("data-lang") as "en" | "ar" | null;
    const resolved: "en" | "ar" = stored === "ar" || bodyAttr === "ar" ? "ar" : "en";

    if (resolved !== "en" && !bodyAttr) {
      document.body.setAttribute("data-lang", resolved);
    }
    setLang(resolved);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<"en" | "ar">).detail;
      if (detail === "en" || detail === "ar") setLang(detail);
    };
    window.addEventListener(LANG_EVENT, handler);
    return () => window.removeEventListener(LANG_EVENT, handler);
  }, []);

  return lang;
}

export const LANG_STORAGE_KEY = STORAGE_KEY;

/** Persist lang to the signed-in user's Firestore doc (best-effort, fire-and-forget). */
async function persistLangToAccount(lang: "en" | "ar") {
  try {
    const { auth } = await import("@/lib/firebase");
    const { db } = await import("@/lib/firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { lang });
  } catch {
    // Never block the UI for a Firestore write failure
  }
}

export function switchLang(lang: "en" | "ar") {
  localStorage.setItem(STORAGE_KEY, lang);
  document.body.setAttribute("data-lang", lang);
  window.dispatchEvent(new CustomEvent<"en" | "ar">(LANG_EVENT, { detail: lang }));
  void persistLangToAccount(lang);
}
