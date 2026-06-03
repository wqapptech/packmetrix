# Tour Package Screen — Technical Documentation

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model](#2-data-model)
3. [Rendering Pipeline](#3-rendering-pipeline)
4. [Normalization Layer](#4-normalization-layer)
5. [Template System](#5-template-system)
6. [Section System](#6-section-system)
7. [Localization](#7-localization)
8. [Responsive Design](#8-responsive-design)
9. [Session & Conversion Tracking](#9-session--conversion-tracking)
10. [Builder Architecture](#10-builder-architecture)
11. [File Reference](#11-file-reference)

---

## 1. Architecture Overview

A tour package landing page is a publicly accessible, agency-branded page that displays a single travel package — itinerary, price, inclusions, hotel, reviews, and a WhatsApp/Messenger CTA. It is served at two URL patterns:

| Context | URL Pattern | Route File |
|---|---|---|
| Packmetrix subdomain | `/{agencySlug}/{packageId}` | `app/[agencySlug]/[packageId]/page.tsx` |
| Custom agency domain | `/{packageId}` (on agency's domain) | `app/sites/[host]/[packageId]/_detail.tsx` |

Both routes use the same rendering pipeline and produce identical output.

### High-level flow

```
Firestore
  packages/{packageId}        → raw TPackage (flat fields + sections[])
  users/{userId}              → TAgency (branding, template, contact)
        │
        ▼
  normalizePkg(pkg, lang)     → hydrated TPackage
  (lib/sections/normalize.ts)   resolves LocalizedStrings → strings
                                migrates legacy flat fields → sections[]
                                derives computed fields
        │
        ▼
  PackageRenderer             → resolves templateId
  (components/PackageRenderer.tsx)
        │
        ▼
  TEMPLATE_MAP[id].Page       → full HTML landing page
  (components/templates/)       desktop + mobile layout
                                sections rendered in order
                                WhatsApp / Messenger CTAs
```

---

## 2. Data Model

### `TPackage` — the package

Defined in `components/templates/types.ts`. Combines three tiers of fields:

**Tier 1 — Core fields** (stored at the top level of the Firestore document)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Firestore document ID |
| `agencySlug` | `string` | Owning agency's slug |
| `userId` | `string` | Firestore UID of the agency owner |
| `destination` | `string` | Display destination name |
| `price` | `string` | Display price string (e.g. "2,950 SAR") |
| `nights` | `string \| number` | Duration |
| `currency` | `string` | ISO currency code |
| `primaryLanguage` | `"en" \| "ar"` | Primary content language |
| `title` | `LocStr` | Package title, potentially bilingual |
| `description` | `LocStr` | Short description |
| `coverImage` | `string` | Hero image URL |
| `images` | `string[]` | Gallery image URLs |
| `videoUrl` | `string` | YouTube/Vimeo URL |
| `whatsapp` | `string` | WhatsApp number with country code |
| `messenger` | `string` | Facebook Messenger username |
| `isActive` | `boolean` | Whether the page is publicly accessible |
| `templateId` | `string` | Active template ID (overrides agency default) |
| `wasPrice` | `string` | Struck-through "was" price for Pulse template |
| `spotsRemaining` | `number` | Urgency counter for Pulse template |

**Tier 2 — Sections array**

```typescript
sections: AnySectionInstance[]
```

Each section instance has:
```typescript
{
  type:  string,           // e.g. "itinerary", "inclusions", "hotel"
  order: number,           // render position
  data:  Record<string, unknown>  // typed per-section payload
}
```

**Tier 3 — Computed / derived fields** (set by `normalizePkg`, not stored)

| Field | Derived from |
|---|---|
| `saving` | `wasPrice - price` |
| `viewersNow` | Random 2–8 (Pulse scarcity signal) |
| `resolvedTitle` | `title.en` or `title.ar` per lang |
| `resolvedDescription` | `description.en` or `description.ar` per lang |

---

### `LocStr` — bilingual strings

```typescript
type LocalizedString = { en?: string; ar?: string };
type LocStr = string | LocalizedString;
```

A field can be a plain string or an object with separate `en`/`ar` values. `normalizePkg` resolves all `LocStr` fields to plain strings for the requested language before the template receives the data.

---

### `TAgency` — the agency brand

```typescript
interface TAgency {
  name:           string;
  tagline?:       string;
  logoUrl?:       string;
  brandColor?:    string;   // CSS hex, e.g. "#1f5f8e"
  activeTemplate: string;   // default template ID for this agency
  agencySlug:     string;
  enableReviews:  boolean;
  showReviews:    boolean;
}
```

---

### `TPageProps` — what every template receives

```typescript
interface TPageProps {
  pkg:          TPackage;
  agency:       TAgency;
  onWhatsApp:   () => void;
  onMessenger:  () => void;
  lang:         "en" | "ar";
}
```

Templates are pure presentation components — they never fetch data or perform side effects. All async work is done upstream.

---

## 3. Rendering Pipeline

### Step 1 — Route handler fetches raw data

`app/[agencySlug]/[packageId]/page.tsx` (and its custom-domain equivalent `_detail.tsx`):

```typescript
// 1. Fetch package
const pkgSnap = await getDoc(doc(db, "packages", packageId));
if (!pkgSnap.exists()) { router.push("/builder"); return; }
const rawData = { id: pkgSnap.id, ...pkgSnap.data() } as TPackage;

// 2. Normalize
const pkg = normalizePkg(rawData);

// 3. Fetch agency
const userSnap = await getDoc(doc(db, "users", rawData.userId));
const agency: TAgency = { ...userSnap.data() };

// 4. Determine language
const lang = pkg.primaryLanguage === "ar" ? "ar" : "en";
```

### Step 2 — PackageRenderer resolves the template

`components/PackageRenderer.tsx`:

```typescript
const templateId =
  props.templateId ||          // explicit override (preview mode)
  agency.activeTemplate ||     // agency's chosen default
  DEFAULT_TEMPLATE_ID;         // "aurora" (system fallback)

const template = TEMPLATE_MAP[templateId] ?? TEMPLATE_MAP[DEFAULT_TEMPLATE_ID];
return <template.Page {...props} />;
```

### Step 3 — Template renders the full page

Each template is a self-contained React component tree that:
1. Reads `pkg.sections` to find which sections to render
2. Uses `useIsDesktop()` to switch between mobile and desktop layouts
3. Applies template-specific design tokens (colors, fonts, spacing)
4. Wires `onWhatsApp` / `onMessenger` to contact buttons

---

## 4. Normalization Layer

`lib/sections/normalize.ts` — 422 lines

The normalization function transforms raw Firestore data into a fully resolved, type-safe `TPackage`. It runs once per page load on the client.

### Entry point

```typescript
export function normalizePkg(pkg: TPackage, lang?: string): TPackage
```

### What it does

**1. Resolves all LocalizedString fields**

Iterates every section's `data` object recursively and resolves `{ en, ar }` objects to plain strings for the requested language:

```typescript
function resolveLocStr(v: LocStr, lang: string): string {
  if (typeof v === "string") return v;
  return (lang === "ar" ? v.ar : v.en) ?? v.en ?? v.ar ?? "";
}
```

**2. Extracts and hydrates typed sections**

For each known section type, a dedicated extractor function builds the typed data object:

| Extractor | Output | Legacy fallback |
|---|---|---|
| `extractAgent()` | `TAgent` | `pkg.agent` flat field |
| `extractTrekProfile()` | `TTrekProfile` | `pkg.difficulty`, `pkg.maxAltitude` etc. |
| `extractScarcity()` | `TScarcity` | `pkg.spotsRemaining`, `pkg.wasPrice` |
| `extractPeople()` | `TPerson[]` | Legacy `guide` section |
| `extractDepartures()` | `TDeparture[]` | `pkg.departuresDates`, `pkg.flights` |
| `extractAirports()` | `TAirport[]` | `departures[].origin` |

**3. Migrates legacy flat fields into sections**

Packages created before the v2 sections model used top-level fields:

| Legacy field | Migrated to |
|---|---|
| `pkg.itinerary[]` | `sections[type="itinerary"]` |
| `pkg.includes[]` | `sections[type="inclusions"]` |
| `pkg.advantages[]` | `sections[type="highlights"]` |
| `pkg.pricingTiers[]` | `sections[type="pricing"]` |
| `pkg.images[]` | `sections[type="media"]` |
| `pkg.videoUrl` | `sections[type="media"].videoUrl` |

**4. Derives computed fields**

```typescript
// Saving amount for Pulse template
if (pkg.wasPrice && pkg.price) {
  pkg.saving = parseFloat(pkg.wasPrice) - parseFloat(pkg.price);
}

// Live viewer count (visual urgency signal)
pkg.viewersNow = Math.floor(Math.random() * 7) + 2;
```

---

## 5. Template System

### Template registry

`components/templates/index.ts` defines all templates:

```typescript
export const DEFAULT_TEMPLATE_ID = "aurora";

export const TEMPLATES: TemplateDefinition[] = [
  { id: "aurora",   name: "Aurora",   Page: TemplateAuroraPage,   Card: TemplateAuroraCard,   ... },
  { id: "voyage",   name: "Voyage",   Page: TemplateVoyagePage,   Card: TemplateVoyageCard,   dark: true, ... },
  // ... 8 more
];

export const TEMPLATE_MAP: Record<string, TemplateDefinition> =
  Object.fromEntries(TEMPLATES.map(t => [t.id, t]));
```

### The 10 templates

| ID | Name | Target segment | Namespace | Key visual identity |
|---|---|---|---|---|
| `aurora` | Aurora | Luxury · Boutique | `.au` | Serif-heavy, editorial chapters, gold accent, cream bg |
| `voyage` | Voyage | Youth · 18–35 | `.vo` | Dark mode, lime green accent, mosaic grid, bold sans |
| `pulse` | Pulse | Last-minute deals | `.pu` | Urgency red, countdown, crossed-out price, spots counter |
| `sakina` | Sakina | Religious · Umrah/Hajj | `.sk` | Bismillah header, Islamic green, prayer-time slots |
| `petal` | Petal | Honeymoons · Couples | `.pt` | Rose pink, italics, romantic copy, couple-centric trust |
| `compass` | Compass | Adventure · Trekking | `.co` | Trek profile card (difficulty/altitude/km), earthy tones |
| `atlas` | Atlas | Premium curated | `.at` | Burgundy, multi-day narrative, curated-travel aesthetic |
| `tribe` | Tribe | Group tours | `.tb` | Clay orange, group messaging, team-building vibe |
| `smart` | Smart | Budget · Transparent | `.sm` | Minimal, yellow, itemised price breakdown |
| `family` | Family | Family vacations | `.fa` | Sage green, kid activities, fun tone |

### `TemplateDefinition` shape

```typescript
interface TemplateDefinition {
  id:             string;
  name:           string;
  nameAr:         string;
  target:         string;      // e.g. "Luxury · Boutique"
  targetAr:       string;
  Page:           React.FC<TPageProps>;
  Card:           React.FC<TCardProps>;
  previewBg:      string;      // background shown in template picker
  templateColor:  string;      // brand accent hex
  available:      boolean;
  dark?:          boolean;     // Voyage only
}
```

### Template structure (Aurora example)

Every template file is self-contained and follows this pattern:

```tsx
"use client";

import "@/app/aurora.css";                    // Scoped CSS (namespace: .au)
import { useIsDesktop, DesktopNav, ... } from "./shared";  // Shared primitives only
import type { TPageProps, TCardProps } from "./types";

// ── Design constants ────────────────────────────────────────
const BG     = "#fdfcf9";
const INK    = "#0d1b2e";
const BRAND  = "#1f5f8e";

// ── Section data helpers (defined inside each template) ─────
function findSec(pkg: TPackage, type: string) {
  return pkg.sections?.find(s => s.type === type);
}
function secStr(data: unknown, key: string): string { ... }
function secArr(data: unknown, key: string): unknown[] { ... }

// ── Internal section components ─────────────────────────────
function AuItinerary({ pkg, lang }: ...) { ... }
function AuInclusions({ pkg, lang }: ...) { ... }
function AuPricing({ pkg, lang }: ...) { ... }
// ... one component per section, named with template prefix

// ── Desktop layout ───────────────────────────────────────────
function AuDesktopPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  return (
    <>
      <DesktopNav agency={agency} onWhatsApp={onWhatsApp} lang={lang} />
      <AuHero pkg={pkg} onWhatsApp={onWhatsApp} lang={lang} />
      <AuItinerary pkg={pkg} lang={lang} />
      <AuInclusions pkg={pkg} lang={lang} />
      <AuPricing pkg={pkg} lang={lang} />
      {/* ... remaining sections */}
      <DesktopFooter />
    </>
  );
}

// ── Mobile layout ─────────────────────────────────────────────
function AuMobilePage({ ... }: TPageProps) { ... }

// ── Page export (entry point) ─────────────────────────────────
export function TemplateAuroraPage(props: TPageProps) {
  const isDesktop = useIsDesktop();
  return isDesktop
    ? <AuDesktopPage {...props} />
    : <AuMobilePage {...props} />;
}

// ── Card export (used in gallery / listing) ───────────────────
export function TemplateAuroraCard(props: TCardProps) { ... }
```

### CSS scoping

Each template has a dedicated CSS file with a BEM namespace. Styles never bleed across templates:

```css
/* app/aurora.css */
.au-hero { ... }
.au-hero__title { ... }
.au-section { ... }
```

Templates never use global class names or import another template's CSS.

### Shared primitives (what IS shared)

From `components/templates/shared.tsx`:

| Export | Type | Description |
|---|---|---|
| `useIsDesktop()` | Hook | Returns `true` if viewport ≥ 1024px |
| `IsDesktopProvider` | Context | Override for tests / Storybook |
| `DesktopNav` | Component | Sticky nav: logo, agency name, book button |
| `DContainer` | Component | Max-width wrapper (1180px) |
| `DesktopFooter` | Component | "Powered by Packmetrix" footer |
| `WAButton` | Component | Green WhatsApp CTA button |
| `Eyebrow` | Component | Small uppercase label |
| `AgencyBar` | Component | Agency logo + name strip |
| `StickyCTA` | Component | Scroll-triggered bottom CTA |
| `BaseCard` | Component | Generic card shell |

### What is NOT shared

- Section rendering components (each template implements its own)
- Color palettes and spacing values
- Typography choices
- Section ordering and layout decisions

---

## 6. Section System

### Overview

A "section" is a typed content block that can be added to a package. Sections are stored as an ordered array in the Firestore package document and rendered in that order by templates.

### Section storage format

```typescript
// In Firestore: packages/{id}.sections[]
{
  type:  "itinerary",
  order: 1,
  data: {
    days: [
      { day: 1, title: "Arrival in Salalah", desc: "...", chapter: "Chapter 1" },
      // ...
    ]
  }
}
```

### Section types

Defined in `lib/sections/types.ts` and registered in `lib/sections/registry.ts`:

**Content sections**

| Type | Description |
|---|---|
| `itinerary` | Day-by-day schedule with optional chapter groupings |
| `inclusions` | What's included/excluded, meals, visa status |
| `hotel` | Accommodation details, star rating, amenities |
| `highlights` | Key selling points (was `advantages`) |
| `faq` | Question/answer pairs |
| `custom` | Free-form rich text block |
| `extras` | Optional add-ons with prices |
| `important_notes` | Terms, warnings, fine print |
| `about_agency` | Agency bio and credentials |
| `reviews` | Author-written reviews (separate from customer-submitted) |

**Logistics sections**

| Type | Description |
|---|---|
| `pricing` | Pricing tiers by pax count, payment plan, cancellation terms |
| `departures` | Departure dates + origin airports + flight info |
| `transfers` | Ground transport details |
| `visa` | Visa requirements and processing info |

**People sections**

| Type | Description |
|---|---|
| `people` | Tour guide + agent info (replaces legacy `guide` section) |
| `trek_profile` | Difficulty, max altitude, distance, fitness requirement |
| `scarcity` | Spots remaining, urgency signals (Pulse template) |

**Media sections**

| Type | Description |
|---|---|
| `media` | Gallery images + video URL + map image (merges legacy gallery/video/map) |

### Section registry (`lib/sections/registry.ts`)

Every section type has a `SectionTypeDef` that drives both the builder UI and data validation:

```typescript
interface SectionTypeDef {
  type:        string;
  label:       string;         // English display name in builder
  labelAr:     string;         // Arabic display name
  category:    SectionCategory; // "content" | "logistics" | "media" | "social_proof"
  multiple:    boolean;        // can multiple instances exist?
  fields:      FieldDef[];     // drives builder form rendering
  defaultData: Record<string, unknown>;  // empty template for new sections
}
```

Field types (`FieldDef.type`):
- `"text"` — single-line input
- `"textarea"` — multiline input
- `"number"` — numeric input
- `"image"` — image URL with upload trigger
- `"select"` — dropdown with options
- `"toggle"` — boolean switch
- `"repeater"` — array of sub-field groups (used for itinerary days, pricing tiers, etc.)

### Section data helpers (in each template)

Templates access section data using four helpers defined inside each template file:

```typescript
// Find a section by type
function findSec(pkg: TPackage, type: string) {
  return pkg.sections?.find(s => s.type === type);
}

// Safely extract a string from section data
function secStr(data: unknown, key: string): string {
  return typeof (data as any)?.[key] === "string" ? (data as any)[key] : "";
}

// Safely extract an array from section data
function secArr(data: unknown, key: string): unknown[] {
  return Array.isArray((data as any)?.[key]) ? (data as any)[key] : [];
}

// Safely extract a number from section data
function secNum(data: unknown, key: string): number {
  const v = (data as any)?.[key];
  return typeof v === "number" ? v : 0;
}
```

Usage in template:
```typescript
const itinerarySection = findSec(pkg, "itinerary");
const days = secArr(itinerarySection?.data, "days") as TItineraryDay[];
```

### Required sections (all 15 must be implemented in every template)

`itinerary`, `highlights`, `hotel`, `inclusions` (+ meals/visa attributes), `faq`, `custom`, `extras`, `people`, `important_notes`, `about_agency`, `departures`, `pricing`, `transfers`, `media`, `reviews`

---

## 7. Localization

The package screen supports full English/Arabic bilingual content.

### Language resolution

```
pkg.primaryLanguage   →  "en" | "ar"   (set by agency in builder)
      ↓
passed as `lang` prop through entire component tree
      ↓
useEffect / render uses T[lang].someKey for UI strings
      ↓
pkg fields already resolved to single strings by normalizePkg()
```

### Translatable UI strings

`lib/translations.ts` exports `T["en"]` and `T["ar"]` objects containing all UI copy:

```typescript
// Examples:
T["en"].from           = "From"
T["ar"].from           = "من"
T["en"].nightsLabel    = "nights"
T["ar"].nightsLabel    = "ليالٍ"
T["en"].viewPackage    = "View package"
T["ar"].viewPackage    = "عرض الباقة"
```

Templates always use `T[lang].key` — never hard-coded strings.

### RTL layout

When `lang === "ar"`:
- Root `<div dir="rtl">` flips the document direction
- `text-align` and flex directions adapt via CSS logical properties
- Font switches to Cairo / Noto Naskh Arabic (Arabic-first fonts)
- Letter spacing adjusted for Arabic typography

### LocalizedString resolution

Raw Firestore fields may be stored as `{ en: "Salalah Escape", ar: "رحلة صلالة" }`. The normalization layer resolves these before templates receive the data:

```typescript
function resolveLocStr(v: LocStr, lang: string): string {
  if (typeof v === "string") return v;
  return (lang === "ar" ? v.ar : v.en) ?? v.en ?? v.ar ?? "";
}
```

Templates always receive plain strings — they never need to handle the `LocalizedString` union type.

---

## 8. Responsive Design

### Detection hook

`useIsDesktop()` in `components/templates/shared.tsx`:

```typescript
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    mq.addEventListener("change", e => setIsDesktop(e.matches));
  }, []);
  return isDesktop;
}
```

Breakpoint: **1024px** (desktop vs mobile).

### Layout switching pattern

Each template exports one `Page` component that internally branches:

```typescript
export function TemplateAuroraPage(props: TPageProps) {
  const isDesktop = useIsDesktop();
  return isDesktop
    ? <AuDesktopPage {...props} />
    : <AuMobilePage {...props} />;
}
```

Desktop and mobile layouts are completely separate implementations within the same template file — they share no sub-components with each other. This enables pixel-perfect layouts at both breakpoints without media query hacks.

### Sticky CTA

On mobile, a `StickyCTA` component from `shared.tsx` appears when the user scrolls past the hero, providing persistent access to the WhatsApp button.

---

## 9. Session & Conversion Tracking

### Visitor session

A persistent session ID is generated on first visit and stored in `localStorage`:

```typescript
let sid = localStorage.getItem("pmx_session");
if (!sid) {
  sid = crypto.randomUUID();
  localStorage.setItem("pmx_session", sid);
}
```

### View tracking

Fires once on page mount:

```typescript
fetch("/api/track-view", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: packageId, sessionId: sid }),
});
```

### Click tracking

Fires on WhatsApp or Messenger button tap:

```typescript
const trackClick = (type: "whatsapp" | "messenger") =>
  fetch("/api/track-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageId, sessionId, source: type }),
  });
```

### WhatsApp message format

The pre-filled WhatsApp message includes destination, price, and session reference so agencies can correlate leads back to specific package views:

```typescript
const msg = `Hi, I'm interested in the ${pkg.destination} package for ${pkg.price}`;
const url = `https://wa.me/${pkg.whatsapp}?text=${encodeURIComponent(msg)}`;
window.open(url, "_blank");
```

---

## 10. Builder Architecture

`app/builder/page.tsx`

The builder is the agency-facing tool for creating and editing packages. It produces a Firestore document that the landing page reads.

### Component structure

```
BuilderTopBar          ← save, publish, preview toggle, template switcher
  ├── CoreFieldsEditor ← destination, price, nights, title, description, images
  ├── SectionList      ← ordered list of section instances
  │     ├── SectionEditor (per section)
  │     │     └── FieldDef[] from SECTION_REGISTRY[type].fields
  │     └── AddSection modal (browse by category)
  └── LivePreviewPhone ← renders PackageRenderer in a phone frame (live)
```

### Template switching

The `VisualTemplatePicker` shows all 10 templates as mini card previews. Selecting one:
1. Updates `pkg.templateId` in state
2. `LivePreviewPhone` immediately re-renders with the new template
3. On save, `templateId` is written to Firestore

### Section ordering

Sections are stored with an `order` integer. The builder UI allows drag-and-drop reordering. The landing page renders sections in ascending `order` value.

### Legacy data migration

On loading an older package (created before the v2 sections model), the builder runs `upgradeLegacySections()` which converts flat legacy fields into typed section instances:

| Legacy format | v2 section |
|---|---|
| `pkg.gallery[]` + `pkg.videoUrl` | `{ type: "media", data: { images, videoUrl } }` |
| `pkg.flights[]` + `pkg.departureDates[]` | `{ type: "departures", data: { departures[] } }` |
| `{ type: "payment_plan" }` | Merged into `{ type: "pricing", data: { cancellation } }` |
| `{ type: "guide" }` | `{ type: "people", data: { people[] } }` |

This migration runs only in the builder — the normalization layer handles the same conversion for read-only rendering.

### Preset system

`lib/sections/presets.ts` defines package templates (e.g. "Luxury Umrah", "Family Beach Week", "Adventure Trek"). Applying a preset scaffolds all sections with appropriate default data, reducing time-to-first-draft for new packages.

---

## 11. File Reference

| File | Role |
|---|---|
| `components/templates/types.ts` | All TypeScript types: TPackage, TAgency, TPageProps, section shapes |
| `components/templates/index.ts` | Template registry, TEMPLATE_MAP, DEFAULT_TEMPLATE_ID |
| `components/templates/shared.tsx` | Shared primitives: useIsDesktop, DesktopNav, WAButton, etc. |
| `components/templates/TemplateAurora.tsx` | Aurora template (default) |
| `components/templates/TemplateVoyage.tsx` | Voyage template (dark mode, youth) |
| `components/templates/TemplatePulse.tsx` | Pulse template (last-minute urgency) |
| `components/templates/TemplateSakina.tsx` | Sakina template (Umrah/Hajj) |
| `components/templates/TemplatePetal.tsx` | Petal template (honeymoons) |
| `components/templates/TemplateCompass.tsx` | Compass template (trekking) |
| `components/templates/TemplateAtlas.tsx` | Atlas template (premium curated) |
| `components/templates/TemplateTribe.tsx` | Tribe template (group tours) |
| `components/templates/TemplateSmart.tsx` | Smart template (budget/transparent) |
| `components/templates/TemplateFamily.tsx` | Family template (family vacations) |
| `components/PackageRenderer.tsx` | Entry point: resolves template, renders Page |
| `lib/sections/types.ts` | TypeScript types for all section data shapes |
| `lib/sections/registry.ts` | SectionTypeDef registry (fields, labels, defaults) |
| `lib/sections/normalize.ts` | normalizePkg() — hydration, migration, resolution |
| `lib/sections/presets.ts` | Package scaffolding presets |
| `lib/sections/index.ts` | Public API re-exports |
| `lib/translations.ts` | T["en"] / T["ar"] UI string maps |
| `app/[agencySlug]/[packageId]/page.tsx` | Public landing page route (subdomain path) |
| `app/sites/[host]/[packageId]/_detail.tsx` | Public landing page component (custom domain path) |
| `app/builder/page.tsx` | Package builder UI |
| `app/aurora.css` | Aurora template CSS (namespace: `.au`) |
| `app/voyage.css` | Voyage template CSS (namespace: `.vo`) |
| `app/pulse.css` | Pulse template CSS (namespace: `.pu`) |
| `app/sakina.css` | Sakina template CSS (namespace: `.sk`) |
| `app/petal.css` | Petal template CSS (namespace: `.pt`) |
| `app/compass.css` | Compass template CSS (namespace: `.co`) |
| `app/atlas.css` | Atlas template CSS (namespace: `.at`) |
| `app/tribe.css` | Tribe template CSS (namespace: `.tb`) |
| `app/smart.css` | Smart template CSS (namespace: `.sm`) |
| `app/family.css` | Family template CSS (namespace: `.fa`) |
