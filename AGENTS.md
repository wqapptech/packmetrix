<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:template-architecture-rules -->
# Template architecture — NON-NEGOTIABLE

These rules apply to every agent run that touches `components/templates/`.

## Each template is self-contained
- Every template owns a **complete, self-contained** implementation of all 15 sections for both desktop and mobile.
- Templates do **NOT** import `DynamicSections`, `DynamicSectionsDesktop`, or any `SharedX` section component from `shared.tsx`.
- Templates do **NOT** import section components from another template file.
- `DynamicSections` / `DynamicSectionsDesktop` are RETIRED — do not create or call them as a production render path.

## What IS shared (and only this)
- Data types / model: `@/components/templates/types`
- Per-template CSS file (e.g. `@/app/aurora.css`), scoped to the template's namespace
- Trivial layout primitives from `shared.tsx`: `useIsDesktop`, `IsDesktopProvider`, `DesktopNav`, `DContainer`, `DesktopFooter`, `WAButton`, `Eyebrow`, `AgencyBar`, `StickyCTA`, `BaseCard`
- Section-data helpers defined **inside** each template file: `findSec`, `secArr`, `secStr`, `secNum`, `secStrArr`, `secItemStr`, `secArrMixed`

## CSS scoping
Each template's CSS lives in a dedicated file and uses its own BEM namespace so styles never bleed across templates:

| Template | File            | Namespace |
|----------|-----------------|-----------|
| Aurora   | app/aurora.css  | `.au`     |
| Voyage   | app/voyage.css  | `.vo`     |
| Pulse    | app/pulse.css   | `.pu`     |
| Sakina   | app/sakina.css  | `.sk`     |
| Petal    | app/petal.css   | `.pt`     |
| Compass  | app/compass.css | `.co`     |
| Atlas    | app/atlas.css   | `.at`     |
| Tribe    | app/tribe.css   | `.tb`     |
| Smart    | app/smart.css   | `.sm`     |
| Family   | app/family.css  | `.fa`     |

## Data access pattern
All section data comes from the `pkg.sections[]` array. Use `findSec(pkg, "type")` to extract a section. Never access old top-level fields like `pkg.itinerary`, `pkg.includes`, `pkg.advantages`, `pkg.pricingTiers`, or template-specific extras (`pkg.agent`, `pkg.spotsRemaining`, `pkg.wasPrice`) except as legacy fallbacks while migration is in-progress.

## Visual fidelity
If a section looks like another template's section recolored, it is WRONG. Match the design files pixel-for-pixel. Each template must have its own typography, spacing, and component shapes.

## 15 required sections
Every template must implement: `itinerary`, `highlights`, `hotel`, `inclusions` (+ meals/visa attributes), `faq`, `custom`, `extras`, `people`, `important_notes`, `about_agency`, `departures`, `pricing`, `transfers`, `media`, `reviews`.
<!-- END:template-architecture-rules -->
