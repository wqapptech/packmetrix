---
name: Migration phases 1-3 status
description: Code-complete; live migration verified clean on 5 test packages as of 2026-05-25; one tracked debt item open
type: project
---

Phases 1–3 are code-complete as of 2026-05-24. Live migration run and verified clean on 5 test packages 2026-05-25.

**Why:** Full builder + data-model overhaul — v2 schema, bilingual LocalizedString fields, sections[] as sole source of truth, template-per-package, Packages screen redesign.

**What's done:**
- Phase 1: v2 data model, normalizePkg(), LocalizedString, migration script (scripts/migrate-packages-v2.js)
- Phase 2: Removed TemplateExtras concept; people/trek_profile/scarcity are now ordinary sections; template switching is pure selectedTemplateId state change; upgradeLegacySections() + supplementFromFlatFields() run on edit load
- Phase 3: Removed activeTemplate from Branding (app/profile/page.tsx); Packages screen redesigned using design bundle spec (app/packages.css, components/packages/PackageCard.tsx); --dash-* tokens added to globals.css; lib/tokens.ts created for shared JS tokens; BaseCard left untouched (backs all 10 templates)
- Migration script finalized: steps 3/4/5/9 all fixed for merge-vs-replace bug (FieldValue.delete() now applied to all legacy flat fields: agent, difficulty, maxAltitude, distanceKm, fitnessNote, priceWas, spotsRemaining, totalSpots, language)

**Tracked debt (open):**
- **isActive → status migration:** The migration script (step 10) writes `status: "active"|"draft"` alongside `isActive` as a deliberate dual-write. The app still reads `isActive` (`packages/page.tsx`, `components/packages/PackageCard.tsx`). When the app is updated to read `status` instead, the legacy `isActive` field should be cleaned up from all documents. Do not delete `isActive` from Firestore until the app-side switch is complete.

**Pre-production task (open):**
- **Verify idempotency:** Re-run the migration script against one of the 5 already-migrated test docs and confirm it produces 0 changes and 0 errors. The step 3/4/5/9 fixes landed after the test docs were migrated; the stale fields were removed by separate one-off scripts, not by a re-run. Idempotency is expected but not yet verified. Do not trust the script on real data until this passes.

**How to apply:** Migration script is structurally final. Idempotency expected but not yet verified (see pre-production task above). The isActive debt is the only other known gap; flag it if the user touches the active/draft logic in the Packages screen.
