// Onboarding state for the agency welcome wizard.
//
// The wizard (app/welcome) collects the irreducible minimum — brand identity —
// so nothing on the storefront looks broken, then hands off to the persistent
// launch checklist on /dashboard for the bigger tasks (homepage, first package,
// go live). This module owns the small persisted state and the routing gate.
//
// SOURCE OF TRUTH: only `status`, `dismissed`, and `currentStep` are persisted
// here. Checklist completion (brand set, package built, published) stays DERIVED
// from real data on the dashboard so a stale flag can never lie. See
// onboardingChecklist() below.

export type OnboardingStatus = "not_started" | "in_progress" | "complete";

export interface OnboardingState {
  status: OnboardingStatus;
  /** User explicitly skipped the wizard — never auto-show it again. */
  dismissed: boolean;
  /** Resume position within the wizard (0-based). */
  currentStep: number;
  startedAt?: number;
  completedAt?: number;
}

export const DEFAULT_ONBOARDING: OnboardingState = {
  status: "not_started",
  dismissed: false,
  currentStep: 0,
};

/** Normalize an unknown users/{uid}.onboarding blob into a typed state. */
export function readOnboarding(u: Record<string, unknown> | null | undefined): OnboardingState {
  const o = (u?.onboarding as Record<string, unknown> | undefined) || {};
  const status = o.status;
  return {
    status:
      status === "in_progress" || status === "complete" || status === "not_started"
        ? status
        : "not_started",
    dismissed: !!o.dismissed,
    currentStep: typeof o.currentStep === "number" && o.currentStep >= 0 ? o.currentStep : 0,
    startedAt: typeof o.startedAt === "number" ? o.startedAt : undefined,
    completedAt: typeof o.completedAt === "number" ? o.completedAt : undefined,
  };
}

/**
 * Has this account already done meaningful setup outside the wizard? Existing
 * agencies (created before onboarding shipped) have no `onboarding` field but
 * clearly shouldn't be dropped into a first-run wizard — infer from real signal.
 */
export function hasMeaningfulSetup(u: Record<string, unknown> | null | undefined): boolean {
  if (!u) return false;
  const packagesUsed = typeof u.packagesUsed === "number" ? u.packagesUsed : 0;
  return !!(
    u.logoUrl ||
    u.tagline ||
    u.homepage ||
    u.agencySlug ||
    u.customDomain ||
    packagesUsed > 0
  );
}

/**
 * Should the welcome wizard auto-open for this user? True only for genuinely
 * fresh accounts that haven't finished or dismissed it. Existing agencies with
 * real setup are never nagged, even without an `onboarding` field.
 */
export function shouldShowWizard(u: Record<string, unknown> | null | undefined): boolean {
  const ob = readOnboarding(u);
  if (ob.dismissed || ob.status === "complete") return false;
  if (hasMeaningfulSetup(u)) return false;
  return true;
}

/** Where a user should land right after authenticating. */
export function postAuthRoute(u: Record<string, unknown> | null | undefined): string {
  return shouldShowWizard(u) ? "/welcome" : "/dashboard";
}

// ── Firestore patches ───────────────────────────────────────────────────────
// Written under the `onboarding` map on users/{uid}. updateDoc replaces the map
// wholesale, so each patch carries the full state to avoid partial-merge drift.
//
// Firestore rejects `undefined` field values, and readOnboarding leaves
// startedAt/completedAt undefined when absent — so every patch is built through
// cleanState(), which drops undefined keys before the write.

/** Strip undefined-valued keys so the object is Firestore-safe. */
function cleanState(s: OnboardingState): OnboardingState {
  const out = {
    status: s.status,
    dismissed: s.dismissed,
    currentStep: s.currentStep,
  } as OnboardingState;
  if (typeof s.startedAt === "number") out.startedAt = s.startedAt;
  if (typeof s.completedAt === "number") out.completedAt = s.completedAt;
  return out;
}

export function onboardingInit(): OnboardingState {
  return { ...DEFAULT_ONBOARDING };
}

export function onboardingStartPatch(prev: OnboardingState): { onboarding: OnboardingState } {
  return {
    onboarding: cleanState({
      ...prev,
      status: prev.status === "complete" ? "complete" : "in_progress",
      startedAt: prev.startedAt ?? Date.now(),
    }),
  };
}

export function onboardingStepPatch(prev: OnboardingState, step: number): { onboarding: OnboardingState } {
  return {
    onboarding: cleanState({
      ...prev,
      status: prev.status === "complete" ? "complete" : "in_progress",
      currentStep: Math.max(0, step),
      startedAt: prev.startedAt ?? Date.now(),
    }),
  };
}

export function onboardingDismissPatch(prev: OnboardingState): { onboarding: OnboardingState } {
  return { onboarding: cleanState({ ...prev, dismissed: true }) };
}

/** Un-dismiss — bring the launch checklist back after it was hidden. */
export function onboardingRestorePatch(prev: OnboardingState): { onboarding: OnboardingState } {
  return { onboarding: cleanState({ ...prev, dismissed: false }) };
}

export function onboardingCompletePatch(prev: OnboardingState): { onboarding: OnboardingState } {
  return {
    onboarding: cleanState({
      ...prev,
      status: "complete",
      startedAt: prev.startedAt ?? Date.now(),
      completedAt: Date.now(),
    }),
  };
}

// ── Derived launch checklist (dashboard) ────────────────────────────────────

export type ChecklistKey = "brand" | "homepage" | "package" | "publish" | "domain";

export interface ChecklistItem {
  key: ChecklistKey;
  done: boolean;
  optional?: boolean;
}

export interface ChecklistInput {
  hasBrand: boolean;
  hasHomepage: boolean;
  hasAnyPackage: boolean;
  hasPublishedPackage: boolean;
  hasCustomDomain: boolean;
}

/**
 * The launch checklist, computed from REAL data (not persisted flags). The
 * dashboard passes derived booleans; this only orders them and marks the
 * optional domain step.
 */
export function onboardingChecklist(i: ChecklistInput): ChecklistItem[] {
  return [
    { key: "brand", done: i.hasBrand },
    { key: "homepage", done: i.hasHomepage },
    { key: "package", done: i.hasAnyPackage },
    { key: "publish", done: i.hasPublishedPackage },
    { key: "domain", done: i.hasCustomDomain, optional: true },
  ];
}

/** Fraction (0–1) of REQUIRED (non-optional) checklist items complete. */
export function checklistProgress(items: ChecklistItem[]): number {
  const required = items.filter((it) => !it.optional);
  if (!required.length) return 1;
  return required.filter((it) => it.done).length / required.length;
}
