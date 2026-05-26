import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT,
} from "@/lib/tokens";

const DISPLAY = "var(--font-instrument-serif), Georgia, serif";
const SANS    = "var(--font-inter-tight), system-ui, sans-serif";

export const metadata = {
  title: "Data Processing Agreement — Packmetrix",
  description: "GDPR Data Processing Agreement between Packmetrix and travel agencies using the platform.",
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
          <div style={{
            marginTop: 20, padding: "14px 18px",
            background: DA_GOLD_SOFT, borderRadius: 10,
            fontFamily: SANS, fontSize: 13.5, color: DA_INK2, lineHeight: 1.6,
          }}>
            This DPA forms part of the Packmetrix{" "}
            <a href="/terms" style={{ color: DA_GOLD }}>Terms of Service</a>. By using Packmetrix you are entering into this DPA as the <strong>Controller</strong> of your travellers&rsquo; data, with Packmetrix acting as the <strong>Processor</strong>.
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
        <a href="/terms" style={{ color: DA_INK3, textDecoration: "none" }}>Terms</a>
        <span style={{ color: DA_RULE2 }}>·</span>
        <a href="/dpa" style={{ color: DA_GOLD, textDecoration: "none", fontWeight: 500 }}>DPA</a>
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

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 14 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 13.5 }}>
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? DA_SURFACE2 : DA_SURFACE }}>
              <td style={{ padding: "10px 14px", color: DA_INK1, fontWeight: 600, width: "36%", border: `1px solid ${DA_RULE}`, verticalAlign: "top" }}>{label}</td>
              <td style={{ padding: "10px 14px", color: DA_INK2, border: `1px solid ${DA_RULE}`, verticalAlign: "top" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DpaPage() {
  return (
    <LegalShell title="Data Processing Agreement" lastUpdated="26 May 2026">
      <H2>1. Parties and Scope</H2>
      <P>
        This Data Processing Agreement (&ldquo;DPA&rdquo;) is entered into between:
      </P>
      <UL>
        <li><strong>Controller</strong>: you, the travel agency using the Packmetrix platform</li>
        <li><strong>Processor</strong>: Packmetrix, registered in the Netherlands</li>
      </UL>
      <P>
        This DPA applies to all processing of personal data that Packmetrix carries out on your behalf, as described in Article 28 of the GDPR.
      </P>

      <H2>2. Subject Matter of Processing</H2>
      <Table rows={[
        ["Purpose", "Operating the Packmetrix platform: building and hosting travel-package pages, capturing and displaying lead data, providing views and conversion analytics"],
        ["Nature", "Collection, storage, display, export (CSV), and deletion of personal data"],
        ["Type of data", "Lead click events (timestamp, channel, referring package, device type). No traveller phone numbers or personal profiles are stored."],
        ["Data subjects", "Travellers who interact with package pages published by the Controller"],
        ["Duration", "For the duration of the Packmetrix subscription, plus 30 days after termination for data export"],
      ]} />

      <H2>3. Processor Obligations</H2>
      <P>Packmetrix agrees to:</P>
      <UL>
        <li>Process personal data only on documented instructions from the Controller (i.e. operating the service as described)</li>
        <li>Ensure that personnel authorised to process data are bound by confidentiality obligations</li>
        <li>Implement appropriate technical and organisational security measures (see Article 5)</li>
        <li>Assist the Controller in responding to data subject rights requests within the timescales required by the GDPR</li>
        <li>Delete or return all personal data at the end of the service relationship, as chosen by the Controller</li>
        <li>Make available all information necessary to demonstrate compliance with Article 28 GDPR and allow for audits</li>
        <li>Notify the Controller without undue delay (and in any event within 72 hours) upon becoming aware of a personal data breach</li>
      </UL>

      <H2>4. Controller Obligations</H2>
      <P>The Controller (you) agrees to:</P>
      <UL>
        <li>Ensure you have a lawful basis for collecting and processing traveller data via the package pages</li>
        <li>Provide any privacy notices required to inform travellers about the processing</li>
        <li>Only instruct Packmetrix to process data in accordance with applicable law</li>
        <li>Inform Packmetrix promptly of any changes to your processing requirements</li>
      </UL>

      <H2>5. Security Measures</H2>
      <P>Packmetrix implements the following technical and organisational measures:</P>
      <UL>
        <li><strong>Encryption in transit</strong>: all data transmitted over HTTPS/TLS 1.2+</li>
        <li><strong>Encryption at rest</strong>: database and file storage encrypted at rest (Google Firebase)</li>
        <li><strong>Access control</strong>: role-based access; production database access limited to authorised engineers</li>
        <li><strong>Authentication</strong>: multi-factor authentication required for all internal systems</li>
        <li><strong>Incident response</strong>: documented process for detecting, logging, and reporting security incidents</li>
        <li><strong>Data minimisation</strong>: only the minimum data necessary to operate the service is collected</li>
      </UL>

      <H2>6. Sub-processors</H2>
      <P>
        Packmetrix uses the following sub-processors. By accepting this DPA you authorise their use. Packmetrix will notify the Controller at least 14 days before adding new sub-processors that process personal data.
      </P>
      <Table rows={[
        ["Google Firebase", "Authentication, database, file storage — EU (europe-west1)"],
        ["Stripe", "Payment processing — EU and US (SCCs in place)"],
        ["Cloudflare", "CDN, edge routing, custom-domain SSL — EU and global (SCCs in place)"],
        ["PostHog", "Product analytics — EU-hosted instance (Frankfurt)"],
      ]} />

      <H2>7. International Data Transfers</H2>
      <P>
        Where sub-processors transfer personal data outside the EU/EEA, such transfers are made under the European Commission&rsquo;s Standard Contractual Clauses (SCCs, 2021 version) or an adequacy decision. Packmetrix maintains records of all such transfers and will provide evidence on request.
      </P>

      <H2>8. Data Subject Rights</H2>
      <P>
        When Packmetrix receives a request directly from a data subject relating to data processed on behalf of the Controller, Packmetrix will notify the Controller within 5 business days. Packmetrix will provide reasonable technical assistance to help the Controller fulfil the request. The Controller remains responsible for responding to data subjects.
      </P>

      <H2>9. Data Breach Notification</H2>
      <P>
        In the event of a personal data breach affecting data processed under this DPA, Packmetrix will notify the Controller at the email address on file within 72 hours of becoming aware. The notification will include: the nature of the breach, the categories and approximate number of data subjects and records affected, the likely consequences, and the measures taken or proposed to address the breach.
      </P>

      <H2>10. Audits</H2>
      <P>
        The Controller may request an audit of Packmetrix&rsquo;s data-processing activities no more than once per year, with at least 30 days&rsquo; written notice. Audits will be conducted during normal business hours and at the Controller&rsquo;s expense. Packmetrix may satisfy audit requests by providing current ISO 27001 or SOC 2 reports where available, or by answering a written security questionnaire.
      </P>

      <H2>11. Duration and Termination</H2>
      <P>
        This DPA remains in force for as long as Packmetrix processes personal data on behalf of the Controller. On expiry or termination of the Terms of Service, Packmetrix will, at the Controller&rsquo;s choice, delete or return all personal data within 30 days, and certify deletion in writing if requested.
      </P>

      <H2>12. Governing Law</H2>
      <P>
        This DPA is governed by the laws of the Netherlands and subject to the jurisdiction of the courts of Amsterdam.
      </P>

      <H2>13. Contact</H2>
      <P>
        For data-protection matters, contact us at <a href="mailto:hello@packmetrix.com" style={{ color: DA_GOLD }}>hello@packmetrix.com</a>.
      </P>
    </LegalShell>
  );
}
