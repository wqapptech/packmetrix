---
name: Smoke test suite
description: 4-test Playwright smoke suite wired to staging Firebase; run before deploys
type: project
---

Added a minimal smoke test layer (June 2025) covering the 4 critical paths:

1. **publish-render** — storefront shows package destination+price; detail page renders (not unavailable)
2. **auth** — signup shows verify step; bad password shows error; correct credentials reach /builder
3. **builder-save** — autosave to localStorage survives hard reload
4. **storefront-languages** — EN (dir=ltr) and AR (dir=rtl) both render their respective package content

**How:** `npm run smoke` — Playwright starts next dev, runs all 4 tests headless in Chromium, then tears down.

**Why:** Uses staging Firebase project (`packmetrix-staging`) via `.env.local`. All test data is tagged `_smoke:true` with email `smoke.*@packmetrix-test.invalid`. globalTeardown deletes everything automatically (manual fallback: `npm run smoke:cleanup`).

**Key files:**
- `playwright.config.ts`
- `e2e/global-setup.ts` — creates pre-verified user + EN/AR packages via firebase-admin
- `e2e/global-teardown.ts` — deletes all smoke data after suite
- `e2e/helpers.ts` — smokeState() + loginAs()
- `e2e/smoke/*.spec.ts` — 4 test files

**data-testid additions:** `login-email`, `login-password`, `login-submit`, `login-error`, `signup-name`, `signup-email`, `signup-password`, `signup-confirm`, `signup-submit`, `signup-verify-step`, `pkg-page`, `pkg-unavailable`

**Why:** Agent set this up 2026-06-05. Goal: fast pre-deploy sanity check (~90s), not comprehensive coverage.

**How to apply:** When the user asks about running tests or smoke tests, point to `npm run smoke`. If they mention adding more tests, remind them this is intentionally minimal.
