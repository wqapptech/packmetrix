import { PostHog } from "posthog-node";

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === "production";

// On non-production environments all capture calls are silently discarded so
// staging events never appear in the production PostHog project.
const noopClient = new Proxy({} as PostHog, { get: () => () => {} });

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!IS_PRODUCTION) return noopClient;
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}
