import type { IconName } from "@/components/Icon";

// ─── Field types ─────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "image"
  | "video"
  | "imageList"
  | "tagList"
  | "select"
  | "repeater";

export type SelectOption = {
  value: string;
  label: string;
  labelAr?: string;
};

export type FieldDef = {
  key: string;
  label: string;
  labelAr?: string;
  type: FieldType;
  placeholder?: string;
  placeholderAr?: string;
  helpText?: string;
  helpTextAr?: string;
  required?: boolean;
  options?: SelectOption[];
  // repeater-only
  itemFields?: FieldDef[];
  itemLabel?: string;
  itemLabelAr?: string;
  // number constraints
  min?: number;
  max?: number;
  // conditional visibility
  showIf?: (data: Record<string, unknown>) => boolean;
};

// ─── Section taxonomy ─────────────────────────────────────────────────────────

export type SectionCategory = "content" | "logistics" | "media" | "social" | "legal";

// ─── Registry entry ───────────────────────────────────────────────────────────
// `type` is widened to `string` here so this file has no dependency on the
// SectionTypeKey union (which lives in registry.ts and is derived from the
// actual registry entries). Consuming code that needs the narrow key should use
// SectionTypeKey imported from registry.ts or types.ts.
export type SectionTypeDef = {
  type: string;
  label: string;
  labelAr: string;
  icon: IconName;
  description: string;
  descriptionAr: string;
  category: SectionCategory;
  /** Whether multiple instances of this section type are allowed per package */
  multiple: boolean;
  fields: FieldDef[];
  defaultData: Record<string, unknown>;
  /** One-line summary shown on the collapsed section header */
  summaryText?: (data: Record<string, unknown>, lang: "en" | "ar") => string;
};
