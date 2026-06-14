import type { SectionTypeDef } from "./base-types";

/** How well a section renders on the current template. */
export type AffiliationStatus = "full" | "partial" | "none" | "unaffiliated";

/**
 * Returns whether a section renders fully, partially, or not at all on the
 * given template. "unaffiliated" means the section renders on every template.
 */
export function getAffiliationStatus(
  def: SectionTypeDef,
  templateId?: string
): AffiliationStatus {
  if (!def.templateAffiliation) return "unaffiliated";
  if (!templateId) return "none";
  const { full, partial } = def.templateAffiliation;
  if (full.includes(templateId)) return "full";
  if (partial.includes(templateId)) return "partial";
  return "none";
}

/** Joins a list of template IDs into a readable string using their display names. */
function joinNames(ids: string[], lang: "en" | "ar"): string {
  const names = ids.map((id) => id.charAt(0).toUpperCase() + id.slice(1));
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  const last = names[names.length - 1];
  const rest = names.slice(0, -1);
  return lang === "ar"
    ? `${rest.join(" و ")} و ${last}`
    : `${rest.join(", ")} and ${last}`;
}

/**
 * Returns a short note for the "Add a section" picker card.
 * Context-aware when templateId is supplied, generic otherwise.
 * Returns null when no note is needed (section renders fully everywhere).
 */
export function getPickerNote(
  def: SectionTypeDef,
  lang: "en" | "ar",
  templateId?: string
): string | null {
  if (!def.templateAffiliation) return null;
  const { full, partial } = def.templateAffiliation;
  const status = getAffiliationStatus(def, templateId);
  if (status === "full") return null;

  const bestStr = joinNames(full, lang);
  const templateName = templateId
    ? templateId.charAt(0).toUpperCase() + templateId.slice(1)
    : null;

  if (templateName && status === "none") {
    if (lang === "ar") {
      return bestStr
        ? `لن يظهر على قالب ${templateName} — يظهر بشكل أفضل على ${bestStr}`
        : `لن يظهر على قالب ${templateName}`;
    }
    return bestStr
      ? `Won't appear on ${templateName} — best on ${bestStr}`
      : `Won't appear on ${templateName}`;
  }

  if (templateName && status === "partial") {
    if (lang === "ar") {
      return bestStr
        ? `يظهر جزئياً على قالب ${templateName} — العرض الكامل على ${bestStr}`
        : `يظهر جزئياً على قالب ${templateName}`;
    }
    return bestStr
      ? `Only part of this shows on ${templateName} — full view on ${bestStr}`
      : `Only part of this shows on ${templateName}`;
  }

  // No templateId — generic
  if (lang === "ar") {
    let note = bestStr ? `يظهر بشكل أفضل على ${bestStr}` : "";
    if (partial.length > 0) {
      const partialStr = joinNames(partial, lang);
      note += note ? ` · جزئياً على ${partialStr}` : `جزئياً على ${partialStr}`;
    }
    return note || null;
  }
  let note = bestStr ? `Best shown on ${bestStr}` : "";
  if (partial.length > 0) {
    const partialStr = joinNames(partial, lang);
    note += note ? ` · partially on ${partialStr}` : `Partially on ${partialStr}`;
  }
  return note || null;
}

/**
 * Returns the inline hint for an already-added section card in the builder.
 * Returns null when no hint is needed.
 */
export function getBuilderHint(
  def: SectionTypeDef,
  lang: "en" | "ar",
  templateId?: string
): { text: string; severity: "partial" | "none" } | null {
  if (!def.templateAffiliation || !templateId) return null;
  const status = getAffiliationStatus(def, templateId);
  if (status === "full" || status === "unaffiliated") return null;

  const { full } = def.templateAffiliation;
  const bestStr = joinNames(full, lang);
  const templateName = templateId.charAt(0).toUpperCase() + templateId.slice(1);

  if (status === "none") {
    const text =
      lang === "ar"
        ? `لن يظهر هذا القسم على قالب ${templateName}${bestStr ? ` — انتقل إلى ${bestStr} لعرضه` : ""}.`
        : `This section won't appear on ${templateName}${bestStr ? ` — switch to ${bestStr} to show it` : ""}.`;
    return { text, severity: "none" };
  }

  // partial
  const text =
    lang === "ar"
      ? `يظهر هذا القسم جزئياً فقط على قالب ${templateName}${bestStr ? ` — انتقل إلى ${bestStr} للعرض الكامل` : ""}.`
      : `Only part of this section shows on ${templateName}${bestStr ? ` — switch to ${bestStr} for the full view` : ""}.`;
  return { text, severity: "partial" };
}
