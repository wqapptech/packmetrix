<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into PackMetrix. The integration covers client-side event tracking across all key user flows, server-side tracking for critical payment webhook events, user identification on login and signup, and exception capture for error tracking.

**Files created:**
- `instrumentation-client.ts` — PostHog client-side initialization (Next.js 15.3+ pattern, with reverse proxy, exception capture, and debug mode)
- `lib/posthog-server.ts` — Singleton PostHog Node.js client for server-side API routes
- `next.config.ts` — Updated with `/ingest/*` reverse proxy rewrites for posthog-js

**Packages installed:** `posthog-js`, `posthog-node`

**Environment variables set** in `.env.local`: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`

## Events tracked

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully creates an account; includes selected plan and whether they came from the gate flow | `app/signup/page.tsx` |
| `user_logged_in` | User successfully signs in with email and password | `app/login/page.tsx` |
| `login_failed` | Login attempt fails (wrong credentials or auth error); includes error code | `app/login/page.tsx` |
| `package_published` | User publishes a new travel package from the builder; includes destination, price, language, nights | `app/builder/page.tsx` |
| `package_updated` | User saves changes to an existing travel package | `app/builder/page.tsx` |
| `package_deleted` | User deletes a package from the packages page; includes destination and view count | `app/packages/page.tsx` |
| `package_toggled_active` | User toggles a package between active and inactive state | `app/packages/page.tsx` |
| `upgrade_initiated` | User clicks the upgrade/go-Pro button on the paywall; includes billing period, package count, views, and clicks | `app/paywall/page.tsx` |
| `agency_plan_notify_requested` | User requests notification when the Agency tier launches | `app/paywall/page.tsx` |
| `lead_status_updated` | Agency user changes a lead's status (new → contacted → booked / lost); includes previous status and channel | `app/leads/page.tsx` |
| `leads_exported` | User exports their leads list as a CSV file; includes filter and count | `app/leads/page.tsx` |
| `subscription_completed` | **Server-side** — Stripe `checkout.session.completed` webhook received; user upgraded to Pro | `app/api/stripe/webhook/route.ts` |
| `subscription_cancelled` | **Server-side** — Stripe `customer.subscription.deleted` webhook received; user downgraded to free | `app/api/stripe/webhook/route.ts` |

**User identification:** `posthog.identify()` is called with the Firebase user UID and email on both login and signup, linking all subsequent events to the known user.

**Error tracking:** `posthog.captureException()` is called in login, signup, builder submit, and Stripe checkout catch blocks.

## LLM analytics

Manual `$ai_generation` events are captured for every OpenAI call in the project using `posthog-node`. No additional packages were needed. Each event includes model name, input/output token counts, latency, stop reason, and — where available — the Firebase user ID as the distinct ID.

| Event | Span name | File | Notes |
|---|---|---|---|
| `$ai_generation` | `ai_insights` | `lib/aiInsights.ts` | AI-generated performance insights per travel package; distinct ID is the requesting user's Firebase UID |
| `$ai_generation` | `package_rewrite` | `app/api/re-write/route.ts` | AI rewrite of package copy; distinct ID from request body if provided |
| `$ai_generation` | `package_extract` | `app/api/extract/route.ts` | AI extraction of package data from raw text; includes HTTP status; distinct ID from request body if provided |

View LLM traces and generations in PostHog at [/llm-analytics/generations](/llm-analytics/generations).

## Next steps

We've built a dashboard and 5 insights to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1565988)
- [New Signups Over Time](/insights/dXWsGxrR) — daily signup trend over the last 30 days
- [Signup → Upgrade → Paid Conversion Funnel](/insights/jmjh4Ncu) — 3-step conversion funnel from account creation to paid subscription
- [Packages Published vs Updated](/insights/CFsUVXOC) — compares new package creation vs edit activity
- [Lead Status Updates by Status](/insights/ufuPYk6Q) — pipeline health broken down by status (booked, contacted, lost)
- [Upgrade Initiated vs Subscription Completed](/insights/bpNGHIbh) — reveals Stripe checkout drop-off and subscription churn over 90 days

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
