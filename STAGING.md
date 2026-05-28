# Staging Environment

Packmetrix runs two fully isolated Firebase projects:

| | Production | Staging |
|---|---|---|
| Firebase project | `packmetrics-77450` | `packmetrix-staging` |
| Git branch | `main` | `staging` |
| App Hosting backend | `packmetrix` | `packmetrix` |
| URL | `https://packmetrix.com` | `https://packmetrix--packmetrix-staging.europe-west4.hosted.app` |
| Firestore | production data | empty / test data |
| Stripe | live keys (prod) | test-mode keys (`sk_test_`) |
| Emails | sent via Resend | suppressed entirely |
| PostHog analytics | captured | suppressed entirely |
| Custom domains (CF) | enabled | disabled (returns 503) |

---

## How to deploy to staging

Push to the `staging` branch. Firebase App Hosting auto-deploys on every push.

```bash
git checkout staging
git merge main          # or cherry-pick specific commits
git push origin staging
```

Monitor the deploy in **Firebase Console → packmetrix-staging → App Hosting**.

## How to promote staging to production

```bash
git checkout main
git merge staging
git push origin main
```

Production deploys automatically from `main`.

---

## Where credentials live

### Non-sensitive env vars (apphosting.yaml overrides)

Set in **Firebase Console → packmetrix-staging → App Hosting → your backend → Environment tab**.

| Variable | Staging value |
|---|---|
| `NEXT_PUBLIC_ENV` | `staging` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyCO7CeDaly0BNyqAFwkpImesW3n9S-V8gc` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `packmetrix-staging.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `packmetrix-staging` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `packmetrix-staging.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `389953628280` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:389953628280:web:5810b4e3bba6f49871e58d` |
| `NEXT_PUBLIC_APP_URL` | `https://packmetrix--packmetrix-staging.europe-west4.hosted.app` |
| `NEXT_PUBLIC_AGENCY_URL` | `https://packmetrix--packmetrix-staging.europe-west4.hosted.app` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | staging `pk_test_…` |
| `STRIPE_PRICE_ID_FOUNDING_MONTHLY` | staging price ID |
| `STRIPE_PRICE_ID_FOUNDING_ANNUAL` | staging price ID |
| `STRIPE_PRICE_ID_STANDARD_MONTHLY` | staging price ID |
| `STRIPE_PRICE_ID_STANDARD_ANNUAL` | staging price ID |
| `STRIPE_SUCCESS_URL` | `https://packmetrix--packmetrix-staging.europe-west4.hosted.app/dashboard` |
| `STRIPE_CANCEL_URL` | `https://packmetrix--packmetrix-staging.europe-west4.hosted.app/paywall` |
| `CLOUDFLARE_ZONE_ID` | `disabled` |
| `CLOUDFLARE_CUSTOM_HOSTNAME_TARGET` | `disabled` |
| `CLOUDFLARE_FALLBACK_ORIGIN` | `disabled` |
| `PEXELS_API_KEY` | same as production |
| `PIXABAY_API_KEY` | same as production |

### Secrets (Google Cloud Secret Manager)

Create each secret in **GCP Console → packmetrix-staging project → Secret Manager**.  
App Hosting automatically grants its service account access when the backend reads `apphosting.yaml`.

| Secret name | Staging value |
|---|---|
| `FIREBASE_ADMIN_KEY` | Staging service account JSON — see "Formatting the service account key" below |
| `STRIPE_SECRET_KEY` | Staging Stripe `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | Staging Stripe `whsec_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Staging Stripe `pk_test_…` |
| `OPENAI_API_KEY` | Same key as production |
| `CLOUDFLARE_API_TOKEN` | `disabled` (CF feature is blocked on staging anyway) |
| `CRON_SECRET` | Any random string — `openssl rand -hex 32` |
| `RESEND_API_KEY` | `disabled` (email is suppressed on staging anyway) |
| `ADMIN_EMAILS` | `hello@packmetrix.com` |
| `UNSPLASH_ACCESS_KEY` | Same key as production |
| `UNSPLASH_SECRET_KEY` | Same key as production |

### Formatting the service account key

Paste the JSON exactly as downloaded from Firebase — no transformation needed.
`lib/firebase-admin.ts` calls `JSON.parse()` which handles multi-line JSON, and the
`.replace(/\\n/g, "\n")` on the private key handles any escaping automatically.

---

## Verifying a fresh staging deploy

After the first deploy, open `https://packmetrix--packmetrix-staging.europe-west4.hosted.app` and check:

1. **Firebase project** — sign up with a test account; confirm in Firebase Console → packmetrix-staging → Authentication that the user appears there and NOT in packmetrics-77450.
2. **Stripe** — complete a test checkout. In the Stripe dashboard, confirm the event appears in the **staging** Stripe account's test-mode event log.
3. **Emails** — trigger a domain registration (it will 503). Confirm no emails arrive anywhere.
4. **PostHog** — check the production PostHog project; confirm no staging events appear.
5. **`NEXT_PUBLIC_ENV`** — open browser dev tools on staging, run `console.log(process.env.NEXT_PUBLIC_ENV)` (or check the page source for `staging`).

---

## Production-only features disabled on staging

| Feature | Gating code | Behavior on staging |
|---|---|---|
| Outbound emails (domain events) | `lib/email.ts` — `IS_PRODUCTION` guard | All `sendDomain*Email()` calls return immediately |
| PostHog analytics (client) | `instrumentation-client.ts` — `if (NEXT_PUBLIC_ENV === "production")` | `posthog.init()` never called; SDK stays uninitialized |
| PostHog analytics (server) | `lib/posthog-server.ts` — returns `noopClient` | All `capture()` calls are no-ops |
| Custom domain registration | `app/api/domains/route.ts` — early 503 return | Cloudflare For SaaS API never called |
| Stripe key safety | `app/api/stripe/checkout/route.ts` and `webhook/route.ts` | Throws on startup if a live key is detected on staging |

---

## Stripe webhook registration

Stripe webhooks are endpoint-specific. You need one webhook entry per environment.

1. In the **staging** Stripe account → Developers → Webhooks → **Add endpoint**:
   - URL: `https://packmetrix--packmetrix-staging.europe-west4.hosted.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
2. Copy the signing secret (`whsec_…`) and store it as the `STRIPE_WEBHOOK_SECRET` secret in the staging Secret Manager.

---

## Cloud Scheduler (cron) on staging

The `poll-domains` cron job is NOT set up on staging — the custom domain feature is disabled there. If you need to test the cron handler manually:

```bash
curl -X POST \
  https://packmetrix--packmetrix-staging.europe-west4.hosted.app/api/cron/poll-domains \
  -H "X-Cron-Secret: <value of staging CRON_SECRET>"
```

---

## Known operational gotchas

- **`NEXT_PUBLIC_ENV` must be overridden in the Firebase Console.** The `apphosting.yaml` default is `"production"`. If you forget to set the override, staging will behave like production (emails will send, PostHog will capture, Cloudflare calls will fire). Always verify the env value after setting up a new backend.

- **Build-time vs runtime env vars.** `NEXT_PUBLIC_*` vars are baked into the client bundle at build time. If you change an override in the Firebase Console, you must trigger a new deploy for the change to take effect on the client side. Server-side env vars update on the next request after a new deploy.

- **Firestore rules.** The staging project's Firestore starts with no rules (or permissive defaults). Deploy the rules from the repo manually after setting up:
  ```bash
  firebase use packmetrix-staging
  firebase deploy --only firestore:rules
  firebase use default   # switch back to prod
  ```

- **Package share URLs on staging use path-based routing, not subdomains.** Production uses `https://{slug}.packmetrix.com/{id}` (Cloudflare wildcard). Staging uses `https://packmetrix--packmetrix-staging.europe-west4.hosted.app/{slug}/{id}`. The link will work but doesn't look like a customer-facing URL — that's expected.

- **The staging URL is static.** Firebase App Hosting auto-generates the URL once and it doesn't change between deploys. However, if you recreate the backend, you get a new URL and will need to update all the overrides that reference it (`NEXT_PUBLIC_APP_URL`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, Stripe webhook endpoint).

- **Stripe test-mode price IDs differ from production.** Don't copy production price IDs into staging — they're different objects in different Stripe accounts (or in different modes). Create the products and prices in the staging Stripe account and use those IDs.
