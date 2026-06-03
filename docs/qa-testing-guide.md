# Packmetrix — Manual QA Testing Guide

How to conduct the test plan in `qa-test-plan.md` efficiently, as a solo or small team, testing against production.

---

## Before you start (one-time setup, ~30 min)

**Create a tracking sheet.**
Copy the test IDs from the plan into a Google Sheet with columns:

| ID | Description | Result | Bug link | Notes |
|----|-------------|--------|----------|-------|

Use `PASS / FAIL / BLOCKED / SKIP` as result values. Don't mark results in the markdown file — the sheet gives you a live status view and survives edits to the doc.

**Start a screen recorder.**
Run Loom (or QuickTime on Mac) for every session. You will find a bug, move on, and forget exactly how you hit it. A recording is cheaper than trying to reproduce it from memory. Keep recordings by session, not per-test.

**Have everything ready before Day 1 — not mid-session:**
- Test accounts created (`hello+test1` through `hello+arabic`)
- Two browsers open (Chrome primary, Safari incognito)
- Phone next to you, already logged out
- Firebase console and Stripe test dashboard open in separate tabs
- Loom recording started

---

## Session structure

Don't try to do it in one sitting — it's roughly 6–8 hours of real attention. Split into focused blocks:

| Session | Sections | Focus | Approx time |
|---------|----------|-------|-------------|
| 1 | 1–2 | Landing page, templates page | 1.5 hr |
| 2 | 3–6 | Auth, onboarding | 1.5 hr |
| 3 | 7–9 | Branding, AI extraction, builder | 2.5 hr |
| 4 | 10–13 | Packages, agency gallery, leads, billing | 1.5 hr |
| 5 | 14–16 + cleanup | Reviews, cross-cutting, public-page edge cases | 1 hr |

Do session 3 (builder) when you're sharpest — it's the most complex and most important screen.

---

## Two-pass method

For each section, run two passes rather than one slow one:

**Pass 1 — Smoke (fast):**
Go through every test quickly. Mark PASS if it obviously works, FAIL if it obviously doesn't, SKIP/BLOCKED if you can't test it right now. Don't investigate failures yet — log them and move on. The goal is to get through the whole section without stopping.

**Pass 2 — Detail (slow):**
Go back to every FAIL. Reproduce it precisely, write the steps, grab a clip from your screen recording, and file a bug. Now you have a real bug report, not a vague note.

This keeps momentum — you're never stuck mid-section debugging one thing while the rest of the session slips.

---

## Bug report format

For each failure, log exactly three things:

```
Steps to reproduce (numbered, exact)
Expected: what should have happened
Actual: what happened instead
+ screenshot or recording timestamp
```

Nothing else. Don't write paragraphs. The recording has the rest.

---

## Order discipline — rules to follow

**Never fix as you go.**
Log it, finish the section. Fixing mid-session contaminates your test state and you lose track of what you actually tested.

**Leave destructive tests last within each section.**
Account deletion (7.8), cohort cap (13.10), and package deletion (9.23) should always be the final step in their section so you're not rebuilding test state mid-way through.

**Use incognito aggressively.**
Any test that involves "a visitor opens your public page" must be in an incognito window — otherwise you're tracking yourself and the lead and analytics data is wrong.

**Reset between template tests (9.26).**
Each template test should start from a fresh draft, not a repurposed package. Carry-over data from another template is how template-identity bugs hide.

---

## Keeping automation in mind while testing manually

Since you plan to automate later, do one extra thing per test you FAIL: note the **reset state** needed to reproduce it cleanly. For example:

> *Bug in 9.12 (template switch loses data). Reset state: package with title + 2 sections, Aurora selected. Action: switch to Pulse.*

That becomes the `beforeEach` setup for the Playwright test later. Writing it now while it's fresh saves you from reconstructing it from a vague bug report in three months.

---

## After the full pass

Sort your bug sheet by severity before touching any code:

1. Mark each bug: **blocker / minor / cosmetic**
2. Fix all blockers before Phase 2
3. Batch the minors into a single sprint after the first agencies are onboarded

A clean zero-blocker list is the only gate. Don't let minor bugs delay the launch — you'll never find a better moment to collect real feedback than with your first five agencies.
