export const FREE_AI_LIMIT = 10;

/** AI generation cap per plan. Only `scale` has AI enabled; free gets 10 uses. */
export function planAiLimit(plan: string | undefined): number {
  switch (plan) {
    case "scale": return 999999;
    case "free":  return FREE_AI_LIMIT;
    default:      return 0; // start / grow have ai: false
  }
}

export const PLAN_LIMITS = {
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

/** During trial, users get Grow-tier access. */
export const TRIAL_PLAN_LIMITS = PLAN_LIMITS.grow;
