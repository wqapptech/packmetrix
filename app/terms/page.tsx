import {
  DA_BG, DA_SURFACE, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD,
} from "@/lib/tokens";

const DISPLAY = "var(--font-instrument-serif), Georgia, serif";
const SANS    = "var(--font-inter-tight), system-ui, sans-serif";

export const metadata = {
  title: "Terms of Service — Packmetrix",
  description: "Terms governing your use of the Packmetrix platform.",
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
        <a href="/privacy" style={{ color: DA_INK3, textDecoration: "none" }}>Privacy</a>
        <span style={{ color: DA_RULE2 }}>·</span>
        <a href="/terms" style={{ color: DA_GOLD, textDecoration: "none", fontWeight: 500 }}>Terms</a>
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

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated="26 May 2026">
      <P>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Packmetrix platform, operated by Packmetrix, registered in the Netherlands (&ldquo;Packmetrix&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account you agree to these Terms. If you are accepting on behalf of an organisation, you represent that you have authority to bind that organisation.
      </P>

      <H2>1. The Service</H2>
      <P>
        Packmetrix provides a SaaS platform that lets travel agencies create package-landing pages, capture leads, and publish those pages on a custom domain. Features include an AI-assisted content builder, ten visual templates, a WhatsApp/Messenger lead inbox with CSV export, views and conversion analytics, and custom-domain provisioning with automatic SSL.
      </P>
      <P>
        We may add, modify, or remove features at any time. Material changes will be communicated by email at least 14 days in advance.
      </P>

      <H2>2. Account Registration</H2>
      <P>
        You must provide accurate, current information when registering. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. Notify us immediately at <a href="mailto:hello@packmetrix.com" style={{ color: DA_GOLD }}>hello@packmetrix.com</a> if you suspect unauthorised access.
      </P>
      <P>
        You must be at least 18 years old and legally authorised to enter into contracts in your jurisdiction to use Packmetrix.
      </P>

      <H2>3. Subscription and Billing</H2>
      <P>
        Packmetrix is billed monthly or annually via Stripe. The current price for new accounts is €39/month (founding rate, locked for founding members) or €79/month (standard rate). Founding-member pricing is locked at the rate applicable at the time of subscription for the lifetime of that subscription.
      </P>
      <P>
        Subscriptions renew automatically. You may cancel at any time from your account settings; cancellation takes effect at the end of the current billing period. No refunds are issued for partial periods except where required by law.
      </P>
      <P>
        We reserve the right to change our pricing for new subscriptions with at least 30 days&rsquo; notice. Founding-member rates are exempt from price increases.
      </P>
      <P>
        A {14}-day free trial is available for new accounts. No credit card is required during the trial. After the trial, a paid subscription is required to continue publishing package pages.
      </P>

      <H2>4. Acceptable Use</H2>
      <P>You agree not to use Packmetrix to:</P>
      <UL>
        <li>Publish false, misleading, or fraudulent travel packages</li>
        <li>Violate any applicable law or regulation, including consumer-protection and advertising laws</li>
        <li>Infringe intellectual-property rights of third parties</li>
        <li>Upload malware, spam, or any content that interferes with the service</li>
        <li>Attempt to reverse-engineer, scrape, or circumvent security measures</li>
        <li>Resell or white-label access to the platform without written authorisation</li>
      </UL>
      <P>
        We reserve the right to suspend or terminate accounts that violate these terms, at our sole discretion, with or without notice for serious violations.
      </P>

      <H2>5. Content and Intellectual Property</H2>
      <P>
        You retain ownership of all content you upload to Packmetrix (package descriptions, images, itineraries). By uploading content, you grant Packmetrix a limited licence to store, display, and transmit that content solely to provide the service.
      </P>
      <P>
        Packmetrix owns all rights to the platform software, templates, design system, and proprietary algorithms. Nothing in these Terms transfers any intellectual-property rights to you beyond the right to use the service as described.
      </P>
      <P>
        Stock images sourced through the Pexels or Unsplash integration are subject to their respective licences. You are responsible for ensuring your use of those images complies with the applicable licence terms.
      </P>

      <H2>6. Uptime and Support</H2>
      <P>
        We target 99.5% monthly uptime for the public package-page delivery layer. Planned maintenance windows will be announced at least 24 hours in advance. The builder and agency dashboard are best-effort.
      </P>
      <P>
        Support is provided by email at <a href="mailto:hello@packmetrix.com" style={{ color: DA_GOLD }}>hello@packmetrix.com</a>. We aim to respond within one business day for paid accounts.
      </P>

      <H2>7. Limitation of Liability</H2>
      <P>
        To the maximum extent permitted by law, Packmetrix shall not be liable for indirect, incidental, consequential, or punitive damages arising from your use of the service, including but not limited to lost revenue, lost data, or business interruption.
      </P>
      <P>
        Our total aggregate liability to you for any claim arising from these Terms or the service shall not exceed the amount you paid to us in the 12 months preceding the claim.
      </P>

      <H2>8. Indemnification</H2>
      <P>
        You agree to indemnify and hold Packmetrix harmless from any claim, loss, or expense (including reasonable legal fees) arising from your breach of these Terms, your content, or your violation of any third-party rights.
      </P>

      <H2>9. Termination</H2>
      <P>
        Either party may terminate the agreement at any time. On termination, your right to access the platform ceases immediately. We will retain your data for 30 days after termination to allow you to export it, after which it is permanently deleted.
      </P>

      <H2>10. Governing Law and Disputes</H2>
      <P>
        These Terms are governed by the laws of the Netherlands. Any dispute shall be submitted to the exclusive jurisdiction of the courts of Amsterdam, the Netherlands, unless mandatory consumer-protection rules in your country require otherwise.
      </P>

      <H2>11. Changes to These Terms</H2>
      <P>
        We may update these Terms from time to time. We will notify you by email at least 14 days before material changes take effect. Continued use after that date constitutes acceptance of the new Terms.
      </P>

      <H2>12. Contact</H2>
      <P>
        Questions about these Terms? Email <a href="mailto:hello@packmetrix.com" style={{ color: DA_GOLD }}>hello@packmetrix.com</a>.
      </P>
    </LegalShell>
  );
}
