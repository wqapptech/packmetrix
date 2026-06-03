# Custom Domain Implementation — Technical Documentation

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Request Flow](#2-request-flow)
3. [Infrastructure](#3-infrastructure)
4. [Cloudflare for SaaS Configuration](#4-cloudflare-for-saas-configuration)
5. [VPS Nginx Proxy](#5-vps-nginx-proxy)
6. [Next.js Application Layer](#6-nextjs-application-layer)
7. [Firestore Schema](#7-firestore-schema)
8. [API Endpoints](#8-api-endpoints)
9. [Environment Variables & Secrets](#9-environment-variables--secrets)
10. [Security Design](#10-security-design)
11. [User Flow](#11-user-flow)
12. [Admin Flow](#12-admin-flow)
13. [Automated Status Polling](#13-automated-status-polling)
14. [Monitoring & Recovery](#14-monitoring--recovery)
15. [Key Engineering Decisions](#15-key-engineering-decisions)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Architecture Overview

Custom domains allow agencies to serve their Packmetrix package pages from their own domain (e.g. `packages.saz-studio.com`) instead of the default `packmetrix.com/agency-slug` URL.

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| DNS & TLS | Cloudflare for SaaS | Issues TLS certs for custom hostnames, routes traffic |
| Proxy | VPS (DigitalOcean) + Nginx | Accepts any Host header, rewrites to App Hosting origin |
| Application | Firebase App Hosting (Next.js 15) | Resolves tenant from header, serves agency content |
| Database | Firestore | Stores domain state and routing index |
| Domain Registry | Cloudflare API | Creates/polls custom hostname objects |

### Why a VPS proxy is required

Cloudflare for SaaS passes the **original custom hostname** as the `Host` header to the fallback origin. Firebase App Hosting (Google Cloud Run / GFE) routes by `Host` header — it only accepts requests for domains it has registered mappings for. A raw custom hostname (e.g. `packages.saz-studio.com`) has no mapping in GCP, so GCP returns 404.

The VPS Nginx proxy solves this by:
- Accepting any `Host` header (Nginx `server_name _;`)
- Rewriting `Host` to the App Hosting origin FQDN
- Forwarding the original hostname as `X-Tenant-Domain` so the app can resolve the tenant

---

## 2. Request Flow

```
Visitor browser
      │
      │  HTTPS: packages.saz-studio.com/
      ▼
Cloudflare Edge  ←── CF for SaaS custom hostname verified
      │               (TLS terminated, cert issued by CF)
      │  HTTP/HTTPS → proxy.packmetrix.com (fallback origin)
      ▼
VPS: 161.35.21.42  (Nginx, server_name _;)
      │
      │  Rewrites headers:
      │    Host: packmetrix--packmetrics-77450.europe-west4.hosted.app
      │    X-Tenant-Domain: packages.saz-studio.com
      │    X-Proxy-Secret: <secret>
      ▼
Firebase App Hosting (GCP)
      │
      │  Next.js middleware (proxy.ts):
      │    reads X-Proxy-Secret → validates
      │    reads X-Tenant-Domain → "packages.saz-studio.com"
      │    rewrites URL: /sites/packages.saz-studio.com
      ▼
app/sites/[host]/page.tsx
      │
      │  Firestore lookup: customDomains/packages.saz-studio.com
      │    → status: "active", agencySlug: "saz-studio"
      ▼
Agency gallery / package detail page rendered
```

---

## 3. Infrastructure

### VPS (DigitalOcean Droplet)

| Property | Value |
|---|---|
| Provider | DigitalOcean |
| IP | `161.35.21.42` |
| Region | Frankfurt (fra1) |
| Size | 1 vCPU, 512 MB RAM, $6/mo |
| OS | Ubuntu 24.04 LTS |
| Software | Nginx |

### DNS Records (packmetrix.com zone in Cloudflare)

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | proxy | `161.35.21.42` | Proxied (orange) |
| CNAME | cname | `packmetrix--packmetrics-77450.europe-west4.hosted.app` | Proxied (orange) |

### Cloudflare SSL/TLS Mode

Set to **Full** (not Flexible, not Full Strict).

- **Full** — CF connects to origin via HTTPS but does not validate the certificate. Required because the VPS uses a self-signed certificate.
- **Flexible** — CF connects to origin via HTTP. Causes redirect loops with Firebase App Hosting (which enforces HTTPS).
- **Full Strict** — Requires a CA-signed cert on the origin. Would require a Cloudflare Origin Certificate on the VPS.

---

## 4. Cloudflare for SaaS Configuration

### Custom Hostnames

Each agency domain is registered as a **CF for SaaS custom hostname** in the `packmetrix.com` zone via the Cloudflare API.

- **Zone ID**: `cf89d388191248b28e431ebe934c0ee1`
- **Fallback Origin**: `proxy.packmetrix.com`
- **SSL method**: `http` (HTTP validation — no extra DNS records needed from the agency)
- **Wildcard**: disabled (exact hostname only)

### What CF for SaaS does

1. Accepts the CNAME `packages.agency.com → cname.packmetrix.com` from the agency
2. Issues a TLS certificate for the custom hostname
3. Terminates TLS at the CF edge
4. Forwards the request to `proxy.packmetrix.com` (the fallback origin) with the original `Host` header intact

### DNS record the agency must add

```
Type:  CNAME
Name:  packages (or www, or apex)
Value: cname.packmetrix.com
```

For apex domains (`agency.com` without subdomain), agencies must use a CNAME-flattening-compatible DNS provider (Cloudflare, Route53, etc.).

---

## 5. VPS Nginx Proxy

### Configuration file

`/etc/nginx/sites-available/packmetrix-proxy`

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;

    ssl_certificate     /etc/ssl/certs/packmetrix-proxy.crt;
    ssl_certificate_key /etc/ssl/private/packmetrix-proxy.key;

    set $tenant_domain $host;

    location / {
        proxy_pass https://packmetrix--packmetrics-77450.europe-west4.hosted.app;
        proxy_ssl_server_name on;
        proxy_ssl_name packmetrix--packmetrics-77450.europe-west4.hosted.app;

        proxy_set_header Host        packmetrix--packmetrics-77450.europe-west4.hosted.app;
        proxy_set_header X-Tenant-Domain $tenant_domain;
        proxy_set_header X-Proxy-Secret  "<PROXY_SECRET>";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "";

        proxy_read_timeout    60s;
        proxy_connect_timeout 10s;
    }
}
```

### Key Nginx settings explained

| Setting | Reason |
|---|---|
| `server_name _;` | Catch-all — accepts any `Host` header without matching a specific name |
| `proxy_ssl_server_name on` | Sends correct SNI to App Hosting during upstream TLS handshake |
| `proxy_ssl_name <origin>` | Overrides SNI to the App Hosting FQDN (not the custom hostname) |
| `Host: <origin>` | GCP GFE routes by `Host` header — must match the registered App Hosting origin |
| `X-Tenant-Domain: $host` | Passes the original custom hostname to the Next.js app for tenant resolution |
| `X-Proxy-Secret` | Authenticates the proxy so the app trusts the `X-Tenant-Domain` header |

### SSL certificate

Self-signed certificate generated with:

```bash
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/packmetrix-proxy.key \
  -out /etc/ssl/certs/packmetrix-proxy.crt \
  -subj "/CN=proxy.packmetrix.com"
```

Accepted by Cloudflare because SSL mode is **Full** (not Strict).

### Auto-restart configuration

`/etc/systemd/system/nginx.service.d/restart.conf`

```ini
[Service]
Restart=always
RestartSec=5
```

---

## 6. Next.js Application Layer

### Middleware: `proxy.ts`

Runs on every non-static request. Resolves the tenant hostname using a priority chain:

```typescript
// Priority 1: Trusted proxy (VPS via Cloudflare for SaaS)
const proxySecret    = request.headers.get("x-proxy-secret");
const tenantFromWorker =
  proxySecret && proxySecret === process.env.PROXY_SECRET
    ? request.headers.get("x-tenant-domain")
    : null;

// Priority 2: Local dev override
const devOverride = request.headers.get("x-packmetrix-host");

// Priority 3: Standard forwarded host
const rawHost =
  tenantFromWorker ||
  devOverride ||
  request.headers.get("x-forwarded-host") ||
  request.headers.get("host") ||
  "";
```

For a validated custom domain, the middleware rewrites the URL:

```typescript
url.pathname = `/sites/${hostname}${pathname === "/" ? "" : pathname}`;
return NextResponse.rewrite(url);
```

Paths in `BLOCKED_ON_CUSTOM_DOMAIN` (`/login`, `/builder`, `/dashboard`, etc.) return 404 on custom domains to prevent auth UIs from loading under the wrong hostname.

### Route: `app/sites/[host]/`

> **Note**: The directory is named `sites` (no underscore). In Next.js App Router, directories prefixed with `_` are treated as private folders excluded from routing. Using `_sites` caused the URL `/_sites/hostname` to fall through to `[agencySlug]/[packageId]`, which redirected to `/builder`. Renaming to `sites` fixes the routing.

**`app/sites/[host]/page.tsx`** — Gallery page (list of agency packages)

```typescript
const snap = await db.collection("customDomains").doc(host).get();
if (!snap.exists || snap.data()?.status !== "active") notFound();
const agencySlug = snap.data()!.agencySlug;
return <CustomDomainGallery agencySlug={agencySlug} />;
```

**`app/sites/[host]/[packageId]/page.tsx`** — Package detail page

Same domain validation, then renders `CustomDomainPackageDetail` with the resolved `agencySlug` and the `packageId` from the URL.

---

## 7. Firestore Schema

### `customDomains` collection

Document ID = the hostname (e.g. `packages.saz-studio.com`)

```typescript
{
  agencySlug:            string,   // e.g. "saz-studio"
  userId:                string,   // Firestore UID of the agency owner
  cf_hostname_id:        string,   // Cloudflare custom hostname UUID
  status:                "pending_dns" | "verifying" | "ssl_provisioning" | "active" | "failed",
  verification_records:  DnsRecord[],  // TXT records for CF ownership verification
  ssl_records:           DnsRecord[],  // TXT/CNAME records for SSL validation
  error_message:         string,
  created_at:            number,   // Unix ms
  updated_at:            number,   // Unix ms
}
```

### `users` collection — custom domain fields

Denormalised onto the user document for fast profile page reads:

```typescript
{
  customDomain:                    string | null,
  customDomainCfId:                string | null,
  customDomainStatus:              DomainStatus | null,
  customDomainVerificationRecords: DnsRecord[],
  customDomainSslRecords:          DnsRecord[],
  customDomainError:               string | null,
  customDomainCreatedAt:           number | null,
  customDomainUpdatedAt:           number | null,
}
```

### DnsRecord type

```typescript
interface DnsRecord {
  type:  "CNAME" | "TXT";
  name:  string;
  value: string;
}
```

---

## 8. API Endpoints

### `POST /api/domains`

Registers a new custom domain for the authenticated agency.

- Validates hostname format (rejects `packmetrix` hostnames)
- Enforces one domain per agency
- Requires a paid plan (`founding`, `standard`, `grow`, `scale`)
- Calls Cloudflare API → `createCustomHostname(hostname)`
- Writes initial state to Firestore via `upsertDomainState()`
- Sends `sendDomainAddedEmail` to the agency

**Request body**
```json
{ "hostname": "packages.youragency.com" }
```

**Response**
```json
{
  "id": "<cf_hostname_id>",
  "status": "pending_dns",
  "cname_record": { "type": "CNAME", "name": "packages", "value": "cname.packmetrix.com" },
  "verification_records": [...],
  "ssl_records": [...]
}
```

---

### `DELETE /api/domains/[id]`

Removes a custom domain. `[id]` is the Cloudflare hostname ID.

- Calls Cloudflare API → `deleteCustomHostname(id)`
- Clears Firestore via `clearDomainState(userId, hostname)`

---

### `GET /api/domains/[id]/status`

Polls the live status of a custom hostname from Cloudflare.

- Calls Cloudflare API → `getCustomHostname(id)`
- Maps CF status to internal `DomainStatus` via `mapCFStatus()`
- Returns current DNS records for display in the UI

**Response**
```json
{
  "status": "ssl_provisioning",
  "verification_records": [...],
  "ssl_records": [...],
  "error_message": ""
}
```

---

### `PATCH /api/admin/domains/[hostname]`

Admin-only endpoint to manually override domain status.

**Actions**
- `mark_active` — sets status to `"active"`, sends `sendDomainActiveEmail` to the agency owner
- `mark_failed` — sets status to `"failed"` with a custom error message, sends `sendDomainFailedEmail`

Only UIDs listed in the `ADMIN_UIDS` environment variable can call this endpoint.

---

### `GET /api/cron/poll-domains`

Cron job (Cloud Scheduler, runs every 5 minutes) that polls all in-progress domains.

- Queries Firestore for domains with status in `["pending_dns", "verifying", "ssl_provisioning"]`
- For each: calls Cloudflare API, maps new status, updates Firestore
- Transitions `active` and `failed` domains out of the polling set

Authenticated via `X-Cron-Secret` header matched against `CRON_SECRET` env var.

---

## 9. Environment Variables & Secrets

Configured in `apphosting.yaml`. Secrets are stored in Google Cloud Secret Manager and accessed via Firebase App Hosting secret bindings.

| Variable | Type | Description |
|---|---|---|
| `CLOUDFLARE_ZONE_ID` | Value | Cloudflare zone ID for `packmetrix.com` |
| `CLOUDFLARE_CUSTOM_HOSTNAME_TARGET` | Value | `cname.packmetrix.com` — the CNAME value agencies point to |
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflare API token with `Zone:Custom Hostnames:Edit` permission |
| `PROXY_SECRET` | Secret | Random 64-char hex string shared between Nginx and the Next.js app |

### PROXY_SECRET

Generated with:
```bash
openssl rand -hex 32
```

Set in two places:
1. **App Hosting** — via `firebase apphosting:secrets:grantaccess PROXY_SECRET --backend packmetrix`
2. **Nginx config** — hard-coded in the `proxy_set_header X-Proxy-Secret` directive

---

## 10. Security Design

### Trusting X-Tenant-Domain

Without validation, any request could spoof the `X-Tenant-Domain` header to impersonate any agency's domain. The `PROXY_SECRET` prevents this:

```typescript
const tenantFromWorker =
  proxySecret && proxySecret === process.env.PROXY_SECRET
    ? request.headers.get("x-tenant-domain")
    : null;
```

Only requests that present the correct `X-Proxy-Secret` have their `X-Tenant-Domain` trusted. All other requests fall back to the standard `host` header resolution.

### Blocking app routes on custom domains

The following paths are blocked (return 404) when accessed on a custom domain:

```
/login  /signup  /dashboard  /builder  /profile
/leads  /packages  /paywall  /home  /admin
```

This prevents auth UIs from rendering under an agency hostname, which would confuse users and could enable phishing.

### One domain per agency

Enforced at the API level — an agency must delete their existing domain before registering a new one.

### Paid plan gate

Custom domains require `plan` in `["founding", "standard", "grow", "scale"]`. Free-plan users cannot register a domain.

---

## 11. User Flow

1. Agency navigates to **Profile → Custom Domain** section
2. Enters their hostname (e.g. `packages.saz-studio.com`) and clicks **Save domain**
3. The app calls `POST /api/domains` → Cloudflare registers the hostname → status becomes `pending_dns`
4. UI displays the required DNS record:
   ```
   Type:  CNAME
   Name:  packages
   Value: cname.packmetrix.com
   ```
   Plus any TXT verification records from Cloudflare
5. Agency adds the DNS record at their registrar/DNS provider
6. Status auto-polls every 30 seconds via `GET /api/domains/[id]/status`
7. Progress moves: `pending_dns` → `verifying` → `ssl_provisioning` → `active`
8. When active, agency receives a confirmation email and the domain serves their packages

### Status meanings

| Status | Meaning |
|---|---|
| `pending_dns` | CNAME not yet detected by Cloudflare |
| `verifying` | CNAME detected, CF verifying domain ownership |
| `ssl_provisioning` | Ownership verified, SSL certificate being issued |
| `active` | Domain fully live |
| `failed` | Validation timed out or certificate error |

---

## 12. Admin Flow

Admins can view all agency custom domains in the **Admin dashboard** (`/admin`).

For each domain showing an in-progress status, admins can:

- **Mark active** — manually activates the domain (used when CF polling is slow or for testing)
- **Mark failed** — manually fails the domain with a custom error message

Both actions update Firestore and send a transactional email to the agency owner.

Only Firebase UIDs listed in the `ADMIN_UIDS` secret have access to these actions.

---

## 13. Automated Status Polling

Cloud Scheduler triggers `GET /api/cron/poll-domains` every 5 minutes.

The cron job:
1. Queries `customDomains` where `status in ["pending_dns", "verifying", "ssl_provisioning"]`
2. For each domain, fetches live status from `GET /zones/:zoneId/custom_hostnames/:id`
3. Runs `mapCFStatus()` to convert CF's status fields to the internal `DomainStatus`
4. Updates Firestore if the status changed
5. Skips domains where CF reports `active` or `failed` (terminal states) on subsequent runs

### CF status mapping

```
CF: active + SSL active          → active
CF: active + SSL pending_*       → ssl_provisioning
CF: moved                        → failed
CF: SSL validation_timed_out     → failed
CF: SSL pending_validation/etc   → verifying
Default                          → pending_dns
```

---

## 14. Monitoring & Recovery

### Nginx auto-restart

`/etc/systemd/system/nginx.service.d/restart.conf` configures systemd to restart Nginx within 5 seconds of any crash. The VPS reboots start Nginx automatically (`systemctl enable nginx`).

### Uptime monitoring

[UptimeRobot](https://uptimerobot.com) monitors `https://proxy.packmetrix.com` every 5 minutes and sends email alerts on downtime.

### Manual checks

```bash
# Check Nginx status on VPS
ssh root@161.35.21.42
systemctl status nginx

# Test proxy end-to-end
curl -v -H "Host: packages.saz-studio.com" http://161.35.21.42/

# Test through Cloudflare
curl -v https://packages.saz-studio.com/
```

---

## 15. Key Engineering Decisions

### Why Cloudflare for SaaS over a manual DNS approach

CF for SaaS automates TLS certificate issuance and renewal for every agency hostname. The alternative — requiring agencies to configure DNS at Let's Encrypt and manage cert renewals — would add significant operational overhead.

### Why a VPS proxy instead of Cloud Run

Cloud Run domain mappings require Google Search Console domain ownership verification per hostname — impossible to automate for agency-owned domains. The GCP load balancer (GFE) routes based on the `Host` header, rejecting any hostname without a registered mapping. A VPS with Nginx `server_name _;` bypasses this by accepting any hostname.

### Why not Cloudflare Workers

Cloudflare Workers fire on requests routed through the zone's own traffic. For CF for SaaS custom hostnames, traffic flows through an Orange-to-Orange (O2O) path to the fallback origin — Workers do **not** fire on this path unless the account has **Workers for Platforms** (enterprise tier only). The VPS proxy achieves the same result without requiring an enterprise plan.

### Why `sites/` not `_sites/`

Next.js App Router treats directories prefixed with `_` as **private folders excluded from routing**. Rewriting to `/_sites/hostname` caused Next.js to match the `[agencySlug]/[packageId]` dynamic route instead of the intended `_sites/[host]` route, resulting in a redirect to `/builder` for every custom domain. Renaming to `sites/` makes the route segment public and resolvable.

---

## 16. Troubleshooting

### 521 — Web server is down

CF cannot establish a TCP connection to the origin. Nginx is not running on the VPS.

```bash
ssh root@161.35.21.42
systemctl start nginx
```

### 525 — SSL handshake failed

CF is attempting HTTPS to the origin but the TLS handshake fails. Causes:

- SSL/TLS mode set to **Full** but Nginx has no SSL certificate — generate a self-signed cert and add `listen 443 ssl` block
- SSL/TLS mode set to **Full Strict** but the VPS cert is self-signed — either use a Cloudflare Origin Certificate or switch to **Full**

### ERR_TOO_MANY_REDIRECTS on packmetrix.com

SSL/TLS mode is set to **Flexible**. CF connects to App Hosting via HTTP; App Hosting forces HTTPS redirect; CF connects via HTTP again → loop. Fix: set SSL/TLS mode back to **Full**.

### Redirect to `/builder` on custom domain

The `sites/` folder is missing or named `_sites/`. Requests fall through to `[agencySlug]/[packageId]` which redirects when no Firestore package exists with an ID matching the hostname. Ensure the folder is `app/sites/` (no underscore).

### Custom domain shows packmetrix homepage instead of agency content

The Firestore document `customDomains/<hostname>` either does not exist or has `status !== "active"`. The `_sites` page calls `notFound()`. Check Firestore and use the admin dashboard to mark the domain active if the CF status has already reached `active`.

### X-Tenant-Domain not trusted

The `PROXY_SECRET` in Nginx does not match `PROXY_SECRET` in App Hosting secrets. Verify both values match. Re-deploy App Hosting after updating the secret.

### Domain stuck in `pending_dns`

The agency's CNAME has not propagated to Cloudflare's authoritative nameservers yet. Typical propagation time is 5–30 minutes. Verify with:

```bash
dig CNAME packages.agency.com +short
# Expected: cname.packmetrix.com.
```
