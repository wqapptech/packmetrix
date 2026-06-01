---
name: Export feature build state
description: Step-by-step build log for the package export (images + PDF) feature
type: project
---

Image export shipped to staging. PDF disabled at launch — satori layout instability with nested-flex + RTL itinerary could not be stabilised across 14 iterations. PDF entry removed from ExportMenu; only Square and Vertical image formats are offered.

**Files created:**
- `lib/export/fonts.ts` — module-level font cache, fetches Inter/Instrument Serif/IBM Plex Sans Arabic/Noto Naskh Arabic as ArrayBuffer from Google Fonts
- `lib/export/data.ts` — TPackage → ExportData mapper (destination, title, price, wasPrice/saving, highlights, itinerary, inclusions, agency from user doc, real pkgUrl)
- `lib/export/images.tsx` — satori-compatible ShareSquare (1080×1080) and ShareVertical (1080×1920) components
- `lib/export/pdf.tsx` — satori PDF implementation (exists but is not wired into any route or menu; kept for reference)
- `app/api/export/route.ts` — GET handler: verifyUser + pkg.userId ownership check + QR via qrcode + cover image fetch + ImageResponse render
- `components/export/ExportMenu.tsx` — client state machine: idle→menu→generating→ready; desktop dropdown + mobile bottom sheet; language toggle (EN/AR independent of UI lang)

**Modified:**
- `app/builder/page.tsx` — ExportMenu added between Preview and Back buttons in PublishSuccess

**POST-LAUNCH TASK (do not build now):**
Rebuild PDF export using headless Chromium / Playwright (HTML-to-PDF). This renders the nested-flex itinerary timeline and Arabic text shaping correctly and stably — issues satori cannot resolve. Replace the satori pdf.tsx entirely with a Playwright-based route.

**Key decisions:**
- next/og (satori + resvg wasm built into Next.js) — no Puppeteer for images
- pdf-lib for PDF assembly (pure JS) — abandoned at launch, revisit with Playwright approach
- qrcode npm package for real QR (encodes pkgUrl production URL)
- Auth required: Firebase ID token verified server-side + pkg.userId ownership check
- Satori degradation: backdrop-filter/textShadow/repeating-linear-gradient dropped gracefully
- Agency data lives on users/{uid} doc (name, tagline, agencySlug)
