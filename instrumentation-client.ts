import posthog from "posthog-js";

// Analytics are suppressed on non-production environments to avoid polluting
// the production PostHog project with staging events.
if (process.env.NEXT_PUBLIC_ENV === "production") posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",

  // The app uses PostHog only for event capture — feature flags are not used.
  // Disabling flag loading prevents the AbortController-without-reason error
  // (posthog-js 1.372 bug) and the "older flags endpoint" warning that both
  // appear in the browser console on every page load.
  advanced_disable_feature_flags: true,
  disable_surveys: true,
});
