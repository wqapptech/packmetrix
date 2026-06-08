import type { TemplateDefinition } from "./types";

import { TemplateAuroraPage,  TemplateAuroraCard  } from "./TemplateAurora";
import { TemplateCompassPage, TemplateCompassCard } from "./TemplateCompass";
import { TemplatePetalPage,   TemplatePetalCard   } from "./TemplatePetal";
import { TemplateSakinaPage,  TemplateSakinaCard  } from "./TemplateSakina";
import { TemplatePulsePage,   TemplatePulseCard   } from "./TemplatePulse";
import { TemplateTribePage,   TemplateTribeCard   } from "./TemplateTribe";
import { TemplateVoyagePage,  TemplateVoyageCard  } from "./TemplateVoyage";
import { TemplateAtlasPage,   TemplateAtlasCard   } from "./TemplateAtlas";
import { TemplateSmartPage,   TemplateSmartCard   } from "./TemplateSmart";
import { TemplateFamilyPage,  TemplateFamilyCard  } from "./TemplateFamily";

export const TEMPLATES: TemplateDefinition[] = [
  // ── Designed templates (available: true) ─────────────────────────────────
  {
    id: "aurora",
    name: "Aurora",
    nameAr: "أورورا",
    target: "Luxury · Boutique",
    targetAr: "فاخر · بوتيك",
    Page: TemplateAuroraPage,
    Card: TemplateAuroraCard,
    previewBg: "#f5f1ea",
    templateColor: "#8a6a3a",
    available: true,
  },
  {
    id: "voyage",
    name: "Voyage",
    nameAr: "رحلة",
    target: "Youth · 18–35",
    targetAr: "الشباب · 18–35",
    Page: TemplateVoyagePage,
    Card: TemplateVoyageCard,
    previewBg: "#0d1b2e",
    dark: true,
    templateColor: "#4d6b0e",
    available: true,
  },
  {
    id: "pulse",
    name: "Pulse",
    nameAr: "نبض",
    target: "Last-minute Deals",
    targetAr: "عروض اللحظة الأخيرة",
    Page: TemplatePulsePage,
    Card: TemplatePulseCard,
    previewBg: "#fafaf7",
    templateColor: "#e2492a",
    available: true,
  },
  {
    id: "sakina",
    name: "Sakina",
    nameAr: "سكينة",
    target: "Religious · Umrah/Hajj",
    targetAr: "رحلات دينية · عمرة وحج",
    Page: TemplateSakinaPage,
    Card: TemplateSakinaCard,
    previewBg: "#f7f4ed",
    templateColor: "#1a5d4a",
    available: true,
  },
  {
    id: "petal",
    name: "Petal",
    nameAr: "بتلة",
    target: "Honeymoons · Couples",
    targetAr: "شهر العسل · أزواج",
    Page: TemplatePetalPage,
    Card: TemplatePetalCard,
    previewBg: "#faf3ef",
    templateColor: "#c8576f",
    available: true,
  },
  {
    id: "compass",
    name: "Compass",
    nameAr: "بوصلة",
    target: "Adventure · Trekking",
    targetAr: "مغامرات · رحلات",
    Page: TemplateCompassPage,
    Card: TemplateCompassCard,
    previewBg: "#f2f0eb",
    templateColor: "#b85c1f",
    available: true,
  },

  // ── TODO templates (available: false — not yet designed) ──────────────────
  // These appear in the selector as placeholders so agents see the full
  // template roadmap. They are NOT selectable until implemented.
  {
    id: "atlas",
    name: "Atlas",
    nameAr: "أطلس",
    target: "Premium Curated",
    targetAr: "تجارب راقية ومنتقاة",
    Page: TemplateAtlasPage,
    Card: TemplateAtlasCard,
    previewBg: "#f7f0e6",
    templateColor: "#5f1c2a", // --at-burgundy from atlas.css
    available: true,
  },
  {
    id: "tribe",
    name: "Tribe",
    nameAr: "قبيلة",
    target: "Group Tours",
    targetAr: "رحلات جماعية",
    Page: TemplateTribePage,
    Card: TemplateTribeCard,
    previewBg: "#f3ebdf",
    templateColor: "#8a3a1e", // --tr-clay from tribe.css (darkened for builder readability)
    available: true,
  },
  {
    id: "smart",
    name: "Smart",
    nameAr: "ذكي",
    target: "Budget · Transparent",
    targetAr: "اقتصادي · شفاف",
    Page: TemplateSmartPage,
    Card: TemplateSmartCard,
    previewBg: "#ffffff",
    templateColor: "#8a6a10", // --sm-yellow from smart.css (darkened for builder readability)
    available: true,
  },
  {
    id: "family",
    name: "Family",
    nameAr: "عائلة",
    target: "Family Vacations",
    targetAr: "عطلات عائلية",
    Page: TemplateFamilyPage,
    Card: TemplateFamilyCard,
    previewBg: "#fef9f0",
    templateColor: "#3a6b4a", // --fm-green from family.css
    available: true,
  },
];

export const TEMPLATE_MAP: Record<string, TemplateDefinition> = Object.fromEntries(
  TEMPLATES.map(t => [t.id, t])
);

export const DEFAULT_TEMPLATE_ID = "aurora";

/** All 10 templates — all are now available. */
export const AVAILABLE_TEMPLATES = TEMPLATES.filter(t => t.available);
