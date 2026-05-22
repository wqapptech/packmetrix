export const FREE_AI_LIMIT = 10;

export const PLAN_LIMITS = {
  founding: {
    packages: Infinity,
    templates: Infinity,
    users: 2,
    analyticsHistoryDays: Infinity,
    leadExport: true,
    customDomain: true,
    ai: true,
    mobileApp: false,
  },
  standard: {
    packages: Infinity,
    templates: Infinity,
    users: 2,
    analyticsHistoryDays: Infinity,
    leadExport: true,
    customDomain: true,
    ai: true,
    mobileApp: false,
  },
  // Legacy plan names kept for any pre-launch test accounts
  grow: {
    packages: 30,
    templates: Infinity,
    users: 2,
    analyticsHistoryDays: Infinity,
    leadExport: true,
    customDomain: true,
    ai: false,
    mobileApp: false,
  },
  start: {
    packages: 10,
    templates: 2,
    users: 1,
    analyticsHistoryDays: 30,
    leadExport: false,
    customDomain: false,
    ai: false,
    mobileApp: false,
  },
  scale: {
    packages: Infinity,
    templates: Infinity,
    users: 5,
    analyticsHistoryDays: Infinity,
    leadExport: true,
    customDomain: true,
    ai: true,
    mobileApp: true,
  },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

/** During trial, users get full plan access. */
export const TRIAL_PLAN_LIMITS = PLAN_LIMITS.founding;

export function planAiLimit(plan: string | undefined): number {
  switch (plan) {
    case "founding":
    case "standard":
    case "scale": return 999999;
    case "free": return FREE_AI_LIMIT;
    default: return 0;
  }
}

export function canUseCustomDomain(plan: string | undefined): boolean {
  return (
    plan === "founding" ||
    plan === "standard" ||
    plan === "grow" ||
    plan === "scale"
  );
}
