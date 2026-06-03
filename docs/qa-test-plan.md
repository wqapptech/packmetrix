# Packmetrix — Pre-Launch Manual QA Test Plan

A comprehensive manual test pass to execute against production before Phase 2 of the launch (hand-delivering to the first five agencies).

> **Automation note:** This plan is written for manual execution first. Each test case is written so it can be directly converted into a Playwright/Cypress E2E test later. Tests are numbered to serve as stable IDs when you create automation tickets. The `[AUTO-CANDIDATE]` tag marks cases that are high-value automation targets (deterministic, repeatable, no human judgement needed). Tests that require real email delivery, Stripe test mode, or subjective visual checks are better kept manual for now and are tagged `[MANUAL-ONLY]`.

---

## Setup — read before you start

**Environment:** Production. Stripe is in test mode (safe to test billing with test cards).

**Test email convention:** You have one inbox, `hello@packmetrix.com`. Use the `+alias` trick so test accounts are distinct but emails all land in your one mailbox:

- `hello+test1@packmetrix.com`
- `hello+test2@packmetrix.com`
- `hello+test3@packmetrix.com`
- `hello+arabic@packmetrix.com`

These all deliver to `hello@packmetrix.com`. Most email providers (Gmail, Google Workspace, most SMTP) treat them as the same inbox; the app will treat them as different accounts. Verify this works with your provider before starting (send yourself an email to `hello+test@packmetrix.com` — if it arrives in `hello@`, you're good).

**Stripe test cards** (these never charge real money in test mode):
- Successful payment: `4242 4242 4242 4242` (any future expiry, any CVC, any postcode)
- Card declined: `4000 0000 0000 0002`
- Requires 3D Secure auth: `4000 0025 0000 3155`

**Devices needed:** A laptop/desktop browser, a real phone (iOS or Android), and ideally a tablet. For RTL testing, you can use any device — the language toggle is in the UI.

**Browsers to spot-check:** Chrome (primary), Safari (especially on iPhone), and one of Firefox/Edge. Don't test every flow on every browser — test primary flow on Chrome, then spot-check the critical paths (signup, builder publish, public page) on Safari and one other.

**How to use this document:** Work through it in order. Mark each test PASS / FAIL / BLOCKED / SKIP. Note bugs inline. Don't fix as you go — log everything first, then fix in priority order.

**Cleanup:** At the end of this document is a cleanup checklist. Run it after the test pass so test data doesn't clutter production.

---

## Section 1 — Public landing page

The first impression. Test before anyone real sees it.

The landing page has the following sections in order: Nav → Hero → Features → How It Works → Template Showcase → Examples → Pricing → Demo → Final CTA → Footer.

### 1.1 Landing page renders correctly (desktop, EN) `[MANUAL-ONLY]`
Open the landing page in an incognito/private window on desktop. Confirm:
- Page loads without console errors (open DevTools)
- All sections render: nav, hero, features, how-it-works, template showcase, examples (Malta/Salalah cards), pricing, demo booking form, final CTA, footer
- Hero CTA "Claim your founding spot" is visible and styled correctly
- Founding cohort chip shows a number (e.g. "49 of 50 launch spots left")
- No "Get Started Free" or "Start/Grow plans" copy anywhere — only the single founding €39 offer
- Footer info is correct (company, KvK number)
- Footer links include: Privacy, Terms, **DPA** — all three must open valid pages, not 404s

### 1.2 Landing page renders correctly (desktop, AR) `[MANUAL-ONLY]`
Toggle language to Arabic. Confirm:
- All text translates to Arabic
- Layout flips to RTL (logo on right, nav on left, etc.)
- Arabic font renders properly (no missing glyphs, no Latin fallback fonts)
- No English strings leaking through
- All sections (including Examples and Demo form) still render correctly in RTL
- Demo form labels, placeholders, and CTA copy are in Arabic

### 1.3 Landing page renders correctly (mobile, EN) `[MANUAL-ONLY]`
Open on a real phone in Chrome/Safari. Confirm:
- Layout adapts cleanly — no horizontal scrolling
- Hero text is readable, CTA is tappable
- Template showcase scrolls or stacks correctly
- Examples section cards render correctly
- Demo form is usable with a touch keyboard
- Pricing card is readable on a small screen
- Final CTA reachable without excessive scrolling

### 1.4 Landing page renders correctly (mobile, AR) `[MANUAL-ONLY]`
Same as 1.3, in Arabic. RTL on mobile is where layout bugs most often hide — look hard.

### 1.5 Landing CTAs route correctly `[AUTO-CANDIDATE]`
Click each CTA on the landing page:
- "Claim your founding spot" (hero) → routes to `/signup`
- "Login" (nav) → routes to `/login`
- "See It in Action" (hero secondary CTA) → scrolls to the `#demo` booking section on the same page — does NOT navigate away
- Template showcase "see all 10 templates" link → routes to `/templates`
- Pricing CTA → routes to `/signup`
- Final-CTA-band button → routes to `/signup`
- Footer: Privacy → `/privacy`, Terms → `/terms`, DPA → `/dpa` — all valid, no 404

### 1.6 Cohort number is real, not hardcoded `[AUTO-CANDIDATE]`
The cohort chip ("49 of 50 launch spots left") should be data-bound to the backend. Inspect the network tab to confirm a call is made to `/api/founding-spots` and the number in the response matches the number shown. Refresh a few times — number should be consistent.

### 1.7 Template showcase shows real templates `[MANUAL-ONLY]`
The template thumbnails on the landing page should be the *actual* template mini-renders (Aurora paper, Pulse red, Sakina green, etc.), not generic gradient cards. Clicking "see all 10 templates" must route to the `/templates` page (tested in Section 2 below), not a dead anchor like `#pricing`.

### 1.8 Examples section renders correctly `[MANUAL-ONLY]`
The landing page includes two example package cards (Malta trip, Salalah trip) rendered using real template mini-previews. Confirm:
- Both cards show a cover image, destination, price, and template chip
- Cards are not broken or showing placeholder data

### 1.9 Demo booking form — happy path `[MANUAL-ONLY]`
The Demo section (`#demo`) has a contact form for booking a demo. Fill in:
- Name, agency name, WhatsApp number (valid format), and email (optional)
- Leave the hidden `website` field empty (it is a honeypot — never fill it)
- Submit

Confirm:
- Form submits without errors
- Success card appears ("We'll be in touch" or equivalent)
- A submission is recorded in Firestore (check via Firebase console)

### 1.10 Demo booking form — validation `[AUTO-CANDIDATE]`
- Submit with name empty → inline error on name field
- Submit with WhatsApp as "abc" → inline error on WhatsApp field
- Submit with email as "notanemail" → inline error on email field
- Submit with all required fields empty → all errors appear simultaneously
- Fix errors and resubmit → succeeds

### 1.11 Demo booking form — Arabic / mobile `[MANUAL-ONLY]`
Toggle to Arabic, fill the form, submit. Confirm RTL layout, Arabic labels, and submission works.

### 1.12 Trial copy is consistent `[AUTO-CANDIDATE]`
The trial length is mentioned in multiple places. Confirm every mention says the **same number**:
- Signup eyebrow (if present)
- Signup trust strip (if present)
- Dashboard sidebar (after login)
- Billing/paywall page

---

## Section 2 — Templates page (`/templates`)

### 2.1 Templates page renders `[MANUAL-ONLY]`
Navigate to `/templates`. Confirm:
- All 10 templates are listed: Aurora, Voyage, Pulse, Sakina, Petal, Compass, Atlas, Tribe, Smart, Family
- Each has a distinct visual identity visible from the thumbnail — no two look alike
- Each has its target audience label (e.g. "Luxury · Boutique", "Youth · 18–35", etc.)
- CTA on each or on the page routes to `/signup` or the builder

### 2.2 Templates page in Arabic / mobile `[MANUAL-ONLY]`
Toggle to Arabic, confirm template names and labels render in Arabic. Test on a phone.

---

## Section 3 — Signup flow

### 3.1 Signup form renders (desktop, EN) `[AUTO-CANDIDATE]`
Go to `/signup`. Confirm:
- All fields visible (agency name, email, password, confirm)
- Google sign-in button visible
- Trial eyebrow and trust strip visible
- "Already have an account? Log in" cross-link works
- Language toggle visible

### 3.2 Signup with valid email (the happy path) `[MANUAL-ONLY]`
Use `hello+test1@packmetrix.com` as the email. Fill all fields, submit.
- Form submits without error
- Email verification screen appears with envelope icon
- A real email arrives at `hello@packmetrix.com` (check the inbox for the alias `+test1`)
- Click the verification link in the email
- Account is verified; you're routed into the app

### 3.3 Signup with mismatched passwords `[AUTO-CANDIDATE]`
Fill the password and confirm-password fields differently. Submit.
- Inline error appears
- Error message is clear and helpful
- Form blocks submission

### 3.4 Signup with weak password `[AUTO-CANDIDATE]`
Try a password like `123` or `abc`.
- Validation kicks in (either Firebase rejects it or your UI flags it)
- Error is shown clearly

### 3.5 Signup with already-used email `[AUTO-CANDIDATE]`
Try to sign up again with `hello+test1@packmetrix.com`.
- Error appears
- Error message is user-friendly (not a raw Firebase error code)

### 3.6 Signup with Google `[MANUAL-ONLY]`
Click "Continue with Google" — use a Google account you control.
- OAuth flow completes
- Account is created
- You're routed into the app
- Profile data (name, email) is pulled from Google correctly

### 3.7 Signup in Arabic `[MANUAL-ONLY]`
Toggle to AR before submitting. Sign up with `hello+arabic@packmetrix.com`.
- All form labels in Arabic
- RTL layout correct
- Submit works the same way
- Verification email arrives

### 3.8 Signup on mobile `[MANUAL-ONLY]`
Repeat the happy path (3.2) on a real phone. The signup form must be fully usable with touch keyboards.

### 3.9 Email verification — resend `[MANUAL-ONLY]`
On the email-sent screen, click "Resend email."
- A new verification email arrives
- The button doesn't allow infinite spam (some rate limit or visual feedback)

### 3.10 Email verification — wrong address `[AUTO-CANDIDATE]`
On the email-sent screen, click "Wrong address?" or similar.
- You're returned to the signup form to correct it
- No orphaned partial account is left

---

## Section 4 — Login flow

### 4.1 Login form renders (desktop, EN) `[AUTO-CANDIDATE]`
Go to `/login`. Confirm:
- Email and password fields
- Google sign-in button
- "Forgot password?" link
- "Don't have an account? Sign up" cross-link
- Language toggle

### 4.2 Login with valid credentials `[AUTO-CANDIDATE]`
Use `hello+test1@packmetrix.com` and the password you set.
- Successful login routes to the dashboard

### 4.3 Login with wrong password `[AUTO-CANDIDATE]`
Same email, wrong password.
- Error appears, message is user-friendly
- Email field is not cleared (good UX — they only need to retype the password)

### 4.4 Login with non-existent email `[AUTO-CANDIDATE]`
- Error appears
- The error message should not reveal whether the email is registered (security). It should say something generic like "Invalid email or password."

### 4.5 Login with Google `[MANUAL-ONLY]`
Click "Continue with Google" — same Google account as in 3.6.
- Logs in to the existing account (does not create a duplicate)

### 4.6 Login when account exists but Google was used to sign up `[MANUAL-ONLY]`
If 3.6 used Google, try logging in with email/password using the same email — confirm the link-accounts flow appears as designed.

### 4.7 Login in Arabic / mobile `[MANUAL-ONLY]`
RTL correct, mobile keyboard works.

---

## Section 5 — Forgot password / password reset

### 5.1 Forgot password flow `[MANUAL-ONLY]`
On `/login`, click "Forgot password?"
- Routes to `/forgot` (its own page, not a modal)
- Email field is pre-filled if you'd typed an email on the login page
- Submit
- "Email sent" confirmation appears
- A real password-reset email arrives at `hello@packmetrix.com`

### 5.2 Forgot password — non-existent email `[AUTO-CANDIDATE]`
Enter an email that's not registered.
- The flow should still show "Email sent" (security: don't reveal whether the account exists)
- No email actually sends

### 5.3 Reset link works `[MANUAL-ONLY]`
Click the reset link in the email.
- Routes to a password-reset page
- Set a new password
- Confirm it works by logging in with the new password

### 5.4 Reset link in Arabic `[MANUAL-ONLY]`
Repeat 5.1 in Arabic.

---

## Section 6 — Onboarding (first-run dashboard)

Use a brand-new account (`hello+test2@packmetrix.com`) so the first-run state is fresh.

### 6.1 First-run dashboard appears `[AUTO-CANDIDATE]`
Immediately after signup verification, you land on the dashboard.
- The onboarding stepper is visible
- The 3 steps are shown: branding → first package → publish + customize domain
- Stats tiles are ghosted/empty (you have no data yet)
- The stepper's primary CTA points to the first step (branding)

### 6.2 Stepper state is honest `[AUTO-CANDIDATE]`
- Currently no branding set, no package — state should be "starting"
- The stepper visibly shows step 1 as the next action

### 6.3 Stepper updates as you progress `[AUTO-CANDIDATE]`
- Complete branding (set name + logo — see Section 7)
- Return to the dashboard
- Stepper now shows step 1 as done, step 2 (build a package) as the next action
- Build and publish a package (see Section 8)
- Stepper now shows all 3 done — and **disappears entirely** per the design

### 6.4 Onboarding doesn't block `[AUTO-CANDIDATE]`
- Try clicking around the sidebar without completing onboarding
- All sections are accessible
- The agency can build a package even without setting branding (defaults apply)

### 6.5 First-run dashboard in Arabic / mobile `[MANUAL-ONLY]`
Toggle to Arabic — stepper renders in Arabic, RTL. Test on a phone.

---

## Section 7 — Branding / Settings (`/profile`)

### 7.1 Branding page renders `[AUTO-CANDIDATE]`
- All sections visible: agency profile, reviews toggles, custom domain
- Layout matches the design (2-column desktop, stacked mobile)

### 7.2 Set agency name `[AUTO-CANDIDATE]`
- Type a name, save
- Confirm it persists (refresh the page, name is still there)
- Confirm it appears in sidebar/topbar

### 7.3 Upload logo `[MANUAL-ONLY]`
- Upload a real image file (PNG)
- Image displays
- Refresh — logo persists
- Try uploading a too-large file or wrong format — error handled gracefully

### 7.4 Set tagline + WhatsApp default `[AUTO-CANDIDATE]`
- Fill in tagline and default WhatsApp number
- Save
- Persists across refresh

### 7.5 Reviews toggles `[AUTO-CANDIDATE]`
- Toggle "show reviews on pages" on/off
- Toggle "allow new reviews" on/off
- Settings persist

### 7.6 Custom domain — explainer is clear `[MANUAL-ONLY]`
- Read the "How it works" section — does it read as plain-language ops, not sysadmin-y?
- The current packmetrix subdomain (e.g. `packmetrix.com/maraya`) is shown correctly

### 7.7 Custom domain — input flow `[MANUAL-ONLY]`
- Type a domain you don't own (e.g. `test.example.com`)
- Submit
- The flow should not crash — should give clear next-steps for DNS

### 7.8 Account deletion `[MANUAL-ONLY]`
> Do this last on a throwaway account — it is irreversible.
- Locate the delete account option in the profile page
- A confirmation dialog appears before anything is deleted
- Confirm deletion: user removed from Firebase Auth, Firestore documents removed, session immediately invalidated
- Attempting to log in with the deleted account fails gracefully

### 7.9 Branding in Arabic / mobile `[MANUAL-ONLY]`
All labels translate, RTL correct. Form field alignment holds on mobile.

### 7.10 Branding when reached via onboarding `[AUTO-CANDIDATE]`
- Sign up fresh, click into branding from the stepper
- The "Step 1 of 3 — recommended" banner appears at the top
- It says "recommended, not blocking"
- The skip / "Finish step 1" buttons both work and neither blocks navigation

---

## Section 8 — AI Extraction Wizard (`/home`)

This is a first-class authenticated screen. The user pastes raw WhatsApp or itinerary text and the AI extracts a structured package, then sends them to the builder pre-filled.

### 8.1 AI extraction page renders `[AUTO-CANDIDATE]`
Navigate to `/home` from the sidebar. Confirm:
- The 3-step flow is shown: Paste → Extracting → Preview
- The text area accepts multi-line input
- "Extract" / submit button is present

### 8.2 AI extraction — happy path `[MANUAL-ONLY]`
Paste a realistic travel package description (WhatsApp-style text with a destination, price, nights, and a rough itinerary). Submit.
- Loading state appears ("Extracting…")
- Preview screen renders with the extracted data: destination, price, nights, description, highlights
- "Open in builder" or equivalent CTA is present
- Clicking it routes to the builder with the extracted data pre-filled in the form fields

### 8.3 AI extraction — bad input `[AUTO-CANDIDATE]`
- Submit an empty text area → validation error, does not call the API
- Submit gibberish ("aslkdjhals") → API responds gracefully, error message shown, no crash

### 8.4 AI extraction — API failure handling `[AUTO-CANDIDATE]`
Simulate or observe what happens when `/api/extract` returns an error. Confirm:
- An error message is shown to the user
- The user can try again (form is not locked)

### 8.5 AI usage limit `[AUTO-CANDIDATE]`
On a free plan, the AI is capped at 10 extractions. Confirm:
- At the limit, the user sees a clear message that they've hit their AI allowance
- The UI does not silently fail or show a raw API error
- The upgrade path is clear

### 8.6 AI extraction in Arabic / mobile `[MANUAL-ONLY]`
Toggle to Arabic — all labels and copy in Arabic, RTL. Usable with touch keyboard on phone. Extraction from Arabic-language text is a bonus test if you have sample data.

---

## Section 9 — Package builder

This is the most important screen. Test it thoroughly.

### 9.1 Builder entry — Template picker `[AUTO-CANDIDATE]`
Navigate to "New Package" or similar from the dashboard.
- Visual template picker appears — NOT a name list
- All 10 templates render as distinct mini-previews (Aurora paper, Pulse red, Sakina green, Voyage bold, Petal pink, Compass earth, Atlas burgundy, Tribe terracotta, Smart white, Family orange)
- Each template's identity is visible from the thumbnail alone
- "Most picked" and/or "New" badges appear where the design has them
- AI extract banner is visible (paste-text-to-extract)

### 9.2 Trip-type chips (the start-flow) `[AUTO-CANDIDATE]`
- Trip-type chips are visible: Umrah, City break, Beach, Multi-day tour, Day tour, Cruise, Safari, Honeymoon, Not sure yet
- The word "preset" does NOT appear anywhere in the UI
- Saved section sets (if you have any) appear alongside the trip-type chips

### 9.3 Pick a template `[AUTO-CANDIDATE]`
Click Aurora. Confirm:
- Template highlights as selected
- "Start building" button becomes available

### 9.4 Pick a trip type `[AUTO-CANDIDATE]`
Click "Umrah". Confirm:
- Chip highlights
- When you click "Start building," the builder opens with Umrah's sections pre-filled

### 9.5 Build screen — top bar `[AUTO-CANDIDATE]`
- BuilderTopBar appears (not the generic Topbar)
- Breadcrumb: Workspace · Builder · package name
- Draft-saved indicator
- Template chip with gold dot + template name
- "Change template" button works (returns to picker, doesn't lose data)
- "Publish page" CTA is gold and active

### 9.6 Build screen — 3 tabs `[AUTO-CANDIDATE]`
- Tabs visible: Core info / Sections / SEO & social
- Sections tab has a count badge

### 9.7 Core info tab `[AUTO-CANDIDATE]`
- EN/AR language toggle inside the form (segmented)
- Title EN + Title AR side-by-side
- Description EN + AR side-by-side
- Destination, price, currency, nights fields
- WhatsApp + Messenger contact fields
- Cover image upload with preview
- Upload a real image — preview updates

### 9.8 Cover image — Pexels/Unsplash search `[MANUAL-ONLY]`
- Open the image field in the builder
- Search for a destination keyword using the built-in Pexels search
- Select a result image
- Confirm it is set as the cover and appears in the live preview

### 9.9 Sections tab `[MANUAL-ONLY]`
- "Suggested for Aurora" band at top with quick-add chips
- Drag-sortable list of sections
- Each SectionCard has drag handle, icon, label, summary, up/down/delete, expand
- Expanding a section shows the editor inline

### 9.10 Add section menu `[AUTO-CANDIDATE]`
Open the add-section menu. Confirm:
- Sections are categorized: Content / Logistics / Media / Social / Legal (or equivalent grouping)
- All major section types are present: Itinerary, Highlights, Hotel, Inclusions, FAQ, Custom, Extras, Meals, About Agency, Important Notes, People, Pricing, Departures, Transfers, Visa, Trek Profile, Scarcity & Urgency, Media, Reviews

### 9.11 Live preview — exists and updates `[AUTO-CANDIDATE]`
- LivePreviewPhone appears in a dark bezel on the right
- "Live preview" header label + phone/desktop toggle
- As you type in Core info (title, price, description), the preview updates in real time
- The preview reflects the selected template's identity — Aurora preview looks like Aurora

### 9.12 Live preview — template switching `[MANUAL-ONLY]`
This is critical and has historically been buggy.
- Build a package with some data
- Click "Change template" and pick Pulse
- Preview now renders in Pulse's style (red, urgency, scarcity)
- Your data (title, price, sections) is preserved across the switch
- Switch to Sakina — preview now green/parchment
- Switch back to Aurora — data still preserved

### 9.13 Live preview — phone/desktop toggle `[AUTO-CANDIDATE]`
- Click the desktop icon in the preview header
- Preview widens and renders the template's desktop layout
- Click phone — back to phone

### 9.14 Template extras editor `[MANUAL-ONLY]`
Open the template-specific settings (TemplateExtrasEditor — may be a gear icon or a tab within the builder). Confirm:
- It opens without crashing
- Any settings saved persist and are reflected in the live preview

### 9.15 Score chip `[AUTO-CANDIDATE]`
- A quality/completeness score is visible
- It says "doesn't block publishing" or equivalent
- Publish button stays gold/active regardless of low score

### 9.16 Export package `[MANUAL-ONLY]`
Open the export menu in the builder top bar. Confirm:
- Export as CSV — file downloads and is valid
- Export as JSON — file downloads and is valid
- Export as PDF — file downloads and is readable

### 9.17 Publish — happy path `[AUTO-CANDIDATE]`
- Fill enough data to feel realistic
- Click Publish
- PublishSuccess screen appears (full page)
- URL is shown with a Copy button
- WhatsApp + Instagram share buttons
- "Preview" and "Dashboard" buttons
- Click the URL — opens the live public page in a new tab

### 9.18 Live public page renders `[MANUAL-ONLY]`
- The published landing page is live at the URL
- It renders the template's actual visual identity (not a generic version)
- All sections you filled are visible
- Cover image displays
- Contact CTAs work (WhatsApp button opens WhatsApp with prefilled message)
- Mobile-friendly when viewed on phone

### 9.19 Live public page in Arabic `[MANUAL-ONLY]`
- If you filled AR data, toggle the page to Arabic
- Content displays in Arabic, RTL correctly
- Template identity holds in RTL

### 9.20 Edit an existing package `[AUTO-CANDIDATE]`
- Return to packages list
- Click an existing package to edit
- Builder opens with all data loaded
- Make a small change, save
- Confirm change persists and the published page reflects it

### 9.21 Save section set `[AUTO-CANDIDATE]`
- In a package, save your current section combination as a saved set
- Give it a name
- Open a NEW package — the saved set appears as a selectable option in the picker (next to trip-type chips)
- Selecting it pre-fills the sections
- Confirm the UI calls it "saved section set" — NOT "template"

### 9.22 Duplicate a package `[AUTO-CANDIDATE]`
- From the packages list, duplicate an existing published package
- Confirm a new independent copy is created in Draft state
- Edit the duplicate — changes do not affect the original

### 9.23 Delete a package `[AUTO-CANDIDATE]`
- Delete a draft package
- Confirm it disappears from the list
- If the package was published, navigate to its old public URL — confirm it returns a graceful "package unavailable" page, not a 404 or crash

### 9.24 Builder on mobile `[MANUAL-ONLY]`
- Build a package on a phone
- Edit/Preview toggle works
- All form fields usable with touch keyboard
- Publish works
- Live page renders correctly on the same phone

### 9.25 Builder in Arabic `[MANUAL-ONLY]`
- Build a package with AR title/description
- Sections in Arabic
- Save and publish
- Public page renders AR-correctly

### 9.26 Test each template (spot check) `[MANUAL-ONLY]`
For each of the 10 templates, build a quick minimal package and publish. Confirm:
- **Aurora** — paper/serif/gold/editorial
- **Voyage** — dark/bold/youth
- **Pulse** — white/red/urgency, scarcity rendering correctly
- **Sakina** — parchment/green/Umrah-appropriate
- **Petal** — pink/honeymoon-feel
- **Compass** — dark earth/trek-feel, trekProfile section renders if data set
- **Atlas** — premium/burgundy/multi-city
- **Tribe** — terracotta/group-feel
- **Smart** — white/yellow/transparent
- **Family** — orange/honest-scheduling

Don't fill all 15 sections in each — just enough to confirm the template's distinct identity renders. **This is the moment to catch any template still falling back to a generic look.**

---

## Section 10 — Packages screen

### 10.1 Packages list renders `[AUTO-CANDIDATE]`
- Cover-image-first card grid (not a name list)
- Each card shows: cover image, template chip + status, title, meta, 3-up stats, actions
- Stat tiles at top (active packages, views, leads, etc.)
- Filter chips (All, Live, Draft, Top performers)
- "New package" CTA visible

### 10.2 Empty state `[AUTO-CANDIDATE]`
- Sign up fresh — packages list should show the empty state with a clear "Build your first package" CTA

### 10.3 Filter chips work `[AUTO-CANDIDATE]`
- Click "Live" — only published packages show
- Click "Draft" — only drafts show
- Click "All" — everything shows

### 10.4 Sort works `[AUTO-CANDIDATE]`
- Sort by conversion (or whichever sort is available)
- Order changes correctly

### 10.5 Card actions `[AUTO-CANDIDATE]`
- Edit — opens builder for that package
- Preview — opens the public page in a new tab
- Copy link — copies the URL to clipboard (test by pasting)

### 10.6 Analytics tiles update after traffic `[AUTO-CANDIDATE]`
After generating a lead in Section 12 (opening a public page in incognito and clicking WhatsApp), return to the packages screen. Confirm the view and click counts on the stat tiles and package cards have incremented.

### 10.7 Packages in Arabic / mobile `[MANUAL-ONLY]`
Toggle Arabic, confirm layout. Test on phone.

---

## Section 11 — Agency gallery page (`/:agencySlug`)

Every agency has a public gallery showing all their active packages.

### 11.1 Agency gallery renders `[AUTO-CANDIDATE]`
Navigate to `packmetrix.com/<your-agency-slug>` (find the slug on your profile page). Confirm:
- Agency logo and name visible
- All active (published) packages listed as cards
- Draft packages do NOT appear
- Each card links to the individual package page

### 11.2 Agency gallery — empty state `[AUTO-CANDIDATE]`
For a brand-new agency with no published packages, the gallery shows a sensible empty state — not a crash or blank page.

### 11.3 Agency gallery in Arabic / mobile `[MANUAL-ONLY]`
Toggle to Arabic. Test on a phone.

### 11.4 Custom domain pages `[MANUAL-ONLY]`
> Skip this test if you don't have an active, verified custom domain.

If a custom domain is active (status = `active` in Firestore), navigate to:
- `https://<custom-domain>` — agency gallery renders correctly
- `https://<custom-domain>/<packageId>` — package page renders correctly

Confirm no broken assets, no redirect loops, SSL padlock in browser.

---

## Section 12 — Leads

### 12.1 Generate a real lead `[MANUAL-ONLY]`
- Open a published package page in an incognito window (so it's a real visit, not your own)
- Click the WhatsApp CTA
- Return to the leads screen — the lead should appear

### 12.2 Leads list renders `[AUTO-CANDIDATE]`
- Two-column layout: table on the left, detail rail on the right
- Selected lead is highlighted (gold left-border)
- Engagement / channel pills visible
- Timeline visible
- "Open WhatsApp" button is the prominent action

### 12.3 Empty state `[AUTO-CANDIDATE]`
For a fresh account with no leads, the empty state should be clear and not confusing.

### 12.4 Mark-as actions `[AUTO-CANDIDATE]`
- Click "Mark as contacted" or similar
- State persists across refresh
- Heat score updates accordingly

### 12.5 Filter by channel / package / date range `[AUTO-CANDIDATE]`
- Filter leads by channel (WhatsApp vs Messenger) — only the correct leads show
- Filter by package — only leads from that package show
- Filter by date range — leads outside the range disappear

### 12.6 Leads in Arabic / mobile `[MANUAL-ONLY]`
Toggle Arabic. On mobile, the list and detail are two screens (drill-in pattern), not side-by-side.

### 12.7 Honest fallback for unnamed leads `[AUTO-CANDIDATE]`
Most leads from WhatsApp clicks won't have a name. Confirm the UI shows an honest fallback (destination + channel + time) — NOT a fake placeholder name.

### 12.8 Trip Portal teaser renders without crashing `[AUTO-CANDIDATE]`
The "Trip Portal" is a coming-soon feature visible on the leads screen. Confirm:
- The teaser UI renders
- The "Request early access" button submits without error
- No console crash

---

## Section 13 — Billing (`/paywall`)

Stripe is in test mode. These tests are safe.

### 13.1 Billing page renders `[AUTO-CANDIDATE]`
- Current plan card with founding price and "Founding member" tag
- Cohort progress bar showing real cohort count (API-driven, not hardcoded)
- Feature list (all features, no gating shown)
- Payment method section
- Invoice table
- Cancel section

### 13.2 Subscribe — happy path `[MANUAL-ONLY]`
- Click "Claim founding spot" or the primary CTA
- Stripe checkout opens (test mode)
- Use card `4242 4242 4242 4242`, future expiry, any CVC, any postcode
- Subscription created
- Return to billing page
- Plan shows as active, founding rate locked
- Cohort number decremented

### 13.3 Card declined `[MANUAL-ONLY]`
- Try card `4000 0000 0000 0002`
- Decline message shown
- User stays in unsubscribed state — nothing partially charged

### 13.4 Plan limit enforcement `[AUTO-CANDIDATE]`
On a free account (not subscribed, trial expired), attempt to access a feature gated behind a paid plan:
- Set a custom domain → confirm a paywall message or redirect appears
- Access extra templates (if gated) → confirm paywall gate appears
- Confirm the gate copy is clear and the upgrade path is obvious

### 13.5 Trial countdown `[AUTO-CANDIDATE]`
On a newly signed-up account in trial:
- The sidebar and/or billing page shows "X days remaining in your trial"
- The countdown is accurate (check the trial start date in Firestore against today's date)

### 13.6 Invoice table `[MANUAL-ONLY]`
- After subscribing, the first invoice should appear
- Download an invoice — PDF works

### 13.7 Cancel subscription `[MANUAL-ONLY]`
- Click cancel
- Confirmation dialog appears
- The "lose your Founding rate" wording is clear (or whatever policy you settled)
- Cancel — subscription marked as canceled in Stripe test dashboard

### 13.8 Re-subscribe after cancel `[MANUAL-ONLY]`
Re-subscribe after a cancel. Confirm: does the founding rate apply (your policy) or do they pay €79? State the expected behavior here before running the test so the tester knows what "correct" looks like.

### 13.9 Billing in Arabic / mobile `[MANUAL-ONLY]`
All amounts (€39) display correctly in Arabic (not flipped to ٣٩€). Test on phone.

### 13.10 Cohort cap behavior `[MANUAL-ONLY]`
Don't actually push the cohort to 50 in test, but confirm the UI handles the "founding closed" state — inspect the code path, or temporarily set the count to 50 in Firestore and reload. After 50, new signups should see the standard €79 price.

---

## Section 14 — Reviews submission

### 14.1 Reviews toggle enables review submission `[AUTO-CANDIDATE]`
In branding settings (/profile), enable the "allow new reviews" toggle. Open a published package page in incognito and confirm:
- A "Leave a review" option or form is visible on the public page
- The form accepts a name, star rating, and review text

### 14.2 Submit a review — happy path `[MANUAL-ONLY]`
- Submit a valid review from the public page (name, 5 stars, review text)
- Confirm the review appears on the package page (or confirm it's stored in Firestore if moderation is required)
- Confirm the reviews section only appears when the toggle is on

### 14.3 Disable reviews — reviews disappear `[AUTO-CANDIDATE]`
- Turn off the reviews toggle in settings
- Reload the public package page
- Review section no longer shows

---

## Section 15 — Cross-cutting tests

### 15.1 Language toggle is sticky `[AUTO-CANDIDATE]`
- Toggle to Arabic
- Navigate around several screens
- Confirm Arabic persists (not silently reverting to English)
- Log out and back in — does the language preference persist?

### 15.2 Session expiry / logout `[AUTO-CANDIDATE]`
- Logout from any screen
- Routes to login
- Try going back to a protected route — redirected to login

### 15.3 Multi-tab behavior `[MANUAL-ONLY]`
- Open the app in two tabs
- Log out in one — does the other tab know?
- Edit a package in one tab and save — does the other tab still show stale data, or update?
- Note any oddities

### 15.4 Refresh during builder `[AUTO-CANDIDATE]`
- Open the builder, fill some data
- Hard-refresh the page
- Is your unsaved work lost? Confirm the "draft saved" indicator and auto-save behavior

### 15.5 Browser back button `[AUTO-CANDIDATE]`
Throughout the app, test the browser back button doesn't break state. Especially: builder → packages → builder.

### 15.6 Sidebar navigation smoke test `[AUTO-CANDIDATE]`
Click every item in the sidebar (Dashboard, Packages, Builder/AI, Leads, Branding, Billing). Confirm:
- Each routes to the correct page
- The active item is visually highlighted
- No item throws a 404 or error

### 15.7 Performance — initial load `[MANUAL-ONLY]`
- Time how long the landing page takes to load on a normal connection
- Time the dashboard load after login
- Anything over 3 seconds is worth a note

### 15.8 Console errors across the app `[MANUAL-ONLY]`
Open DevTools and click through every major screen. Note any red console errors — they may be benign, but worth checking.

### 15.9 Spot-check on Safari (iOS) `[MANUAL-ONLY]`
Sign up, build a package, publish on Safari iOS. Apple/Safari quirks (date inputs, file uploads, video) often differ.

### 15.10 Spot-check on another browser `[MANUAL-ONLY]`
One run-through of signup → build → publish on Firefox or Edge.

---

## Section 16 — Public-page edge cases

These test the published landing pages your customers' customers see.

### 16.1 Package with sparse data `[AUTO-CANDIDATE]`
- Build a package with the minimum required fields, omit optional sections
- Publish
- Public page should still look complete, not broken — sections gracefully omit

### 16.2 Package with all sections filled `[MANUAL-ONLY]`
- Build a package with every section type populated
- Publish
- All sections render in the template's distinct style

### 16.3 Multi-language package `[AUTO-CANDIDATE]`
- Build a package with both EN and AR content fully filled
- View the public page in EN — only EN content
- View in AR — only AR content
- Switch languages on the public page — actually switches

### 16.4 Single-language package (EN only) `[AUTO-CANDIDATE]`
- Build a package with EN content only, leave AR fields empty
- View in EN — works
- View in AR — what happens? (Probably falls back to EN, or shows an honest empty state)
- Note the actual behavior and confirm it is not a crash

### 16.5 Inactive/deleted package URL `[AUTO-CANDIDATE]`
- Delete or deactivate a published package
- Navigate to its old public URL
- Confirm a graceful "package unavailable" page appears — not a 404 or JS error

### 16.6 Public page on slow connection `[MANUAL-ONLY]`
- Throttle to "Slow 3G" in DevTools
- Open a public page
- Does it still render? Layout stable while loading?

### 16.7 Public page sharing — Open Graph `[MANUAL-ONLY]`
- Copy the public-page URL and paste it into WhatsApp / iMessage / Instagram DM
- Does the link preview render correctly? (Open Graph tags, cover image)
- Test on a real phone

---

## Section 17 — Cleanup checklist (run after testing)

After the test pass, clean up so test data doesn't clutter production.

- [ ] In Stripe test dashboard: cancel any active test subscriptions
- [ ] Delete test packages from each test account (or delete the accounts entirely)
- [ ] In Firebase Auth: delete the test users (`hello+test1`, `hello+test2`, `hello+test3`, `hello+arabic`)
- [ ] In Firestore: delete any orphaned package/lead documents tied to the test accounts
- [ ] Remove any test custom domains you set up
- [ ] Empty your `hello@packmetrix.com` inbox of test verification/reset emails

If you can't bulk-delete: at minimum tag each test account clearly (e.g. add `TEST` to the agency name) so you can identify them later and they don't pollute analytics.

---

## After the test pass — what to do with the results

Sort failures into three buckets:

**Launch blockers** — bugs that would embarrass you or break a real agency's flow. Fix before Phase 2.

**Real but not blockers** — bugs that are real but minor (a misaligned chip, a slightly slow load). Write down, fix in batches over the first month.

**Nice-to-haves** — things that work but feel off. Don't fix during Phase 2. Note for later.

A reasonable launch readiness bar: **zero launch-blockers**, fewer than ~10 real-but-minor issues open.

---

## Automation roadmap

When you're ready to automate, prioritize `[AUTO-CANDIDATE]` tests in this order:

### Phase 1 — Core happy paths (highest ROI, run on every deploy)
1. Signup → email verification → dashboard (mocked email delivery)
2. Login with valid credentials → dashboard
3. Build a package (core info + 2 sections) → publish → public page renders
4. Template switching preserves data
5. Billing: Stripe test checkout → plan becomes active

### Phase 2 — Validation and edge cases
6. All signup validation errors (mismatched password, weak password, duplicate email)
7. All login error cases (wrong password, non-existent email)
8. Password reset form security (non-existent email still shows "sent")
9. Package filter chips (All / Live / Draft)
10. Leads: mark as contacted → state persists

### Phase 3 — Coverage expansion
11. AI extraction happy path and error handling
12. Agency gallery page renders active packages
13. Inactive package URL returns graceful page
14. Language toggle persists across navigation
15. Sidebar navigation smoke test (all links route correctly)

### Recommended tooling
- **Playwright** — best fit for Next.js; handles auth state with `storageState`, parallel browser contexts for multi-tab tests, and mobile viewport emulation
- **Firebase Auth emulator** — use the local emulator for auth tests so you don't need real email delivery in CI
- **Stripe test mode** — keep using test cards in CI; do not mock Stripe
- **Visual regression** — add Percy or Chromatic for the template identity tests (section 9.26) once the templates are stable; these are expensive to run manually every sprint
