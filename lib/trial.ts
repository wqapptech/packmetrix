export const TRIAL_DAYS = 60; // change to 14 after validation

export function trialEndsAtFromNow(): number {
  return Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
}

export function isTrialActive(trialEndsAt: number | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return Date.now() < trialEndsAt;
}

export function trialDaysLeft(trialEndsAt: number | null | undefined): number {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)));
}

/** User has full product access if on a paid plan OR within active trial. */
export function hasFullAccess(
  plan: string | undefined,
  trialEndsAt: number | null | undefined
): boolean {
  if (plan === "start" || plan === "grow" || plan === "scale") return true;
  return isTrialActive(trialEndsAt);
}
