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
  /**
   * When true, this field stores a LocalizedString {en, ar} instead of a
   * plain string. The builder Phase-2 editor will render dual inputs.
   */
  localized?: boolean;
};

// ─── Section taxonomy ─────────────────────────────────────────────────────────

export type SectionCategory = "content" | "logistics" | "media" | "social" | "legal";

// ─── Registry entry ───────────────────────────────────────────────────────────

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
  /**
   * Marks this section type as a v1 legacy type that has been superseded.
   * Legacy types still render for existing packages but are not offered
   * when adding new sections.
   */
  legacy?: boolean;
};
