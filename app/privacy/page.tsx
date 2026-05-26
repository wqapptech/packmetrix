import {
  DA_BG, DA_SURFACE, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD,
} from "@/lib/tokens";

const DISPLAY = "var(--font-instrument-serif), Georgia, serif";
const SANS    = "var(--font-inter-tight), system-ui, sans-serif";

export const metadata = {
  title: "Privacy Policy — Packmetrix",
  description: "How Packmetrix collects, uses, and protects your personal data.",
};

function LegalShell({ title, lastUpdated, children }: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: DA_BG, minHeight: "100vh", fontFamily: SANS }}>
      <div style={{
        borderBottom: `1px solid ${DA_RULE}`,
        background: DA_SURFACE,
        padding: "18px 32px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: DA_INK1, color: DA_GOLD,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: DISPLAY, fontSize: 14, fontWeight: 400,
          }}>P</div>
          <span style={{ fontFamily: DISPLAY, fontSize: 18, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</span>
        </a>
      </div>

      <div style={{ maxWidth: 760, marginInline: "auto", padding: "56px 32px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 44, fontWeight: 400, color: DA_INK1, letterSpacing: -1, lineHeight: 1.05 }}>
            {title}
          </h1>
          <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 13, color: DA_INK3 }}>
            Last updated: {lastUpdated}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${DA_RULE}`, paddingTop: 36 }}>
          {children}
        </div>
      </div>

      <div style={{
        borderTop: `1px solid ${DA_RULE}`,
        padding: "20px 32px",
        display: "flex", justifyContent: "center", gap: 20,
        fontFamily: SANS, fontSize: 12, color: DA_INK3,
      }}>
        <span>© 2026 Packmetrix</span>
        <span style={{ color: DA_RULE2 }}>·</span>
        <a href="/privacy" style={{ color: DA_GOLD, textDecoration: "none", fontWeight: 500 }}>Privacy</a>
        <span style={{ color: DA_RULE2 }}>·</span>
        <a href="/terms" style={{ color: DA_INK3, textDecoration: "none" }}>Terms</a>
        <span style={{ color: DA_RULE2 }}>·</span>
        <a href="/dpa" style={{ color: DA_INK3, textDecoration: "none" }}>DPA</a>
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      margin: "40px 0 14px",
      fontFamily: DISPLAY, fontSize: 26, fontWeight: 400,
      color: DA_INK1, letterSpacing: -0.4, lineHeight: 1.15,
    }}>{children}</h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 14px", fontFamily: SANS, fontSize: 14.5, color: DA_INK2, lineHeight: 1.7 }}>
      {children}
    </p>
  );
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ margin: "0 0 14px", paddingInlineStart: 22, fontFamily: SANS, fontSize: 14.5, color: DA_INK2, lineHeight: 1.7 }}>
      {children}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated="26 May 2026">
      <P>
        Packmetrix (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the Packmetrix platform available at packmetrix.com and agency.packmetrix.com. This Privacy Policy explains what personal data we collect, how we use it, and your rights under the General Data Protection Regulation (GDPR) and applicable Dutch law.
      </P>
      <P>
        By creating an account or using Packmetrix you agree to this policy. If you do not agree, please stop using the service and contact us to delete your account.
      </P>

      <H2>1. Who We Are</H2>
      <P>
        Packmetrix is operated as a business registered in the Netherlands. For data-protection purposes, Packmetrix acts as the <strong>data controller</strong> for account and usage data, and as a <strong>data processor</strong> on behalf of travel agencies for the personal data of their customers (leads).
      </P>
      <P>
        Contact: <a href="mailto:hello@packmetrix.com" style={{ color: DA_GOLD }}>hello@packmetrix.com</a>
      </P>

      <H2>2. Data We Collect</H2>
      <P><strong>Account data</strong> — when you sign up we collect your name, email address, and (optionally) your agency name and WhatsApp number.</P>
      <P><strong>Package content</strong> — destination, price, itinerary, images, and other travel-package information you enter into the builder.</P>
      <P><strong>Lead data</strong> — when a traveller clicks the WhatsApp or Messenger button on your package page, we record the click timestamp, referring URL, and the channel used. We do not store the traveller&rsquo;s phone number or identity.</P>
      <P><strong>Usage analytics</strong> — page views, WhatsApp click counts, and Messenger click counts per package, used to show you conversion statistics.</P>
      <P><strong>Payment data</strong> — billing and subscription data is handled by Stripe. We store only your Stripe customer ID and subscription status; we never see your full card number.</P>
      <P><strong>Technical data</strong> — IP address, browser type, and device type collected automatically when you use the service.</P>

      <H2>3. How We Use Your Data</H2>
      <UL>
        <li>Provide, operate, and improve the Packmetrix platform</li>
        <li>Process payments and manage your subscription</li>
        <li>Send transactional emails (account confirmation, password reset, billing receipts)</li>
        <li>Display views and conversion analytics on your dashboard</li>
        <li>Detect and prevent fraud or abuse</li>
        <li>Comply with legal obligations</li>
      </UL>
      <P>We do not sell your data to third parties. We do not use your data for advertising.</P>

      <H2>4. Legal Bases (GDPR)</H2>
      <UL>
        <li><strong>Contract</strong> (Art. 6(1)(b)) — account data and package content are necessary to provide the service you signed up for.</li>
        <li><strong>Legitimate interest</strong> (Art. 6(1)(f)) — usage analytics and security monitoring, balanced against your rights.</li>
        <li><strong>Legal obligation</strong> (Art. 6(1)(c)) — retaining billing records as required by Dutch tax law.</li>
      </UL>

      <H2>5. Sub-processors and Third Parties</H2>
      <P>We share data with the following service providers, each bound by a Data Processing Agreement:</P>
      <UL>
        <li><strong>Google Firebase</strong> — authentication, database, and file storage (EU region)</li>
        <li><strong>Stripe</strong> — payment processing</li>
        <li><strong>Cloudflare</strong> — CDN, custom-domain SSL provisioning</li>
        <li><strong>PostHog</strong> — product analytics (self-hosted EU instance)</li>
        <li><strong>Pexels / Unsplash</strong> — stock photo search (images are fetched client-side; only search queries are sent)</li>
      </UL>

      <H2>6. Data Retention</H2>
      <P>
        Account data is retained for as long as you have an active account. If you delete your account, your data is removed within 30 days, except where retention is required by law (e.g. billing records are kept for 7 years under Dutch tax law).
      </P>
      <P>
        Package pages you delete are removed immediately from public access and purged from our database within 30 days.
      </P>

      <H2>7. International Transfers</H2>
      <P>
        Your data is stored on servers located in the European Union. If any sub-processor transfers data outside the EU/EEA, it does so under the European Commission&rsquo;s Standard Contractual Clauses (SCCs).
      </P>

      <H2>8. Your Rights</H2>
      <P>Under the GDPR you have the right to:</P>
      <UL>
        <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
        <li><strong>Rectification</strong> — ask us to correct inaccurate data</li>
        <li><strong>Erasure</strong> — request deletion of your data (&ldquo;right to be forgotten&rdquo;)</li>
        <li><strong>Restriction</strong> — ask us to pause processing of your data</li>
        <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
        <li><strong>Object</strong> — object to processing based on legitimate interest</li>
      </UL>
      <P>
        To exercise any of these rights, email us at <a href="mailto:hello@packmetrix.com" style={{ color: DA_GOLD }}>hello@packmetrix.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with the Dutch Data Protection Authority (<a href="https://www.autoriteitpersoonsgegevens.nl" style={{ color: DA_GOLD }}>Autoriteit Persoonsgegevens</a>).
      </P>

      <H2>9. Cookies</H2>
      <P>
        Packmetrix uses a single session cookie for authentication (essential, no consent required) and PostHog analytics cookies to understand product usage. You can opt out of analytics by emailing us or by using your browser&rsquo;s do-not-track setting.
      </P>

      <H2>10. Changes to This Policy</H2>
      <P>
        We may update this policy from time to time. We will notify you by email and by posting the new version on this page with an updated &ldquo;Last updated&rdquo; date. Continued use of the service after changes constitutes acceptance.
      </P>

      <H2>11. Contact</H2>
      <P>
        Questions about this policy? Email <a href="mailto:hello@packmetrix.com" style={{ color: DA_GOLD }}>hello@packmetrix.com</a>. We aim to respond within 2 business days.
      </P>
    </LegalShell>
  );
}
