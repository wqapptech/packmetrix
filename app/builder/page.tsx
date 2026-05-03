"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

type Airport = { name: string; price: string };
type ItineraryDay = { day: number; title: string; desc: string };
type PricingTier = { label: string; price: string };

type Form = {
  destination: string;
  price: string;
  nights: string;
  description: string;
  includes: string[];
  excludes: string[];
  airports: Airport[];
  itinerary: ItineraryDay[];
  pricingTiers: PricingTier[];
  cancellation: string;
  whatsapp: string;
  messenger: string;
};

const DEFAULT_FORM: Form = {
  destination: "",
  price: "",
  nights: "5",
  description: "",
  includes: ["Flights", "Hotel", "Breakfast daily", "Airport transfers"],
  excludes: ["Lunches & dinners", "Personal expenses"],
  airports: [{ name: "", price: "" }],
  itinerary: [
    { day: 1, title: "", desc: "" },
    { day: 2, title: "", desc: "" },
    { day: 3, title: "", desc: "" },
  ],
  pricingTiers: [
    { label: "Per person (2 pax)", price: "" },
    { label: "Solo traveller", price: "" },
  ],
  cancellation: "Free cancellation up to 30 days before departure",
  whatsapp: "",
  messenger: "",
};

const STEPS = ["Basics", "Details", "Itinerary", "Pricing", "Contact"];

// ── shared field components ───────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)",
      letterSpacing: "0.5px", textTransform: "uppercase" as const,
      marginBottom: 8, marginTop: 18,
    }}>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
        padding: "10px 14px", color: "var(--white)",
        fontSize: 13, fontFamily: "inherit", outline: "none",
        transition: "border-color 0.2s",
      }}
      onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
    />
  );
}

// ── step components ───────────────────────────────────────────────────────────

function Step0({ form, update }: { form: Form; update: (k: keyof Form, v: any) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Basic Information</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Core details about the package</p>
      <FieldLabel>Destination</FieldLabel>
      <TextInput value={form.destination} onChange={v => update("destination", v)} placeholder="e.g. Marrakech, Morocco" />
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Base Price</FieldLabel>
          <TextInput value={form.price} onChange={v => update("price", v)} placeholder="e.g. €899" />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Nights</FieldLabel>
          <TextInput value={form.nights} onChange={v => update("nights", v)} placeholder="5" />
        </div>
      </div>
      <FieldLabel>Description</FieldLabel>
      <textarea
        value={form.description}
        onChange={e => update("description", e.target.value)}
        placeholder="Brief package description..."
        style={{
          width: "100%", height: 100,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "10px 14px",
          color: "var(--white)", fontSize: 13, fontFamily: "inherit",
          outline: "none", resize: "none" as const, lineHeight: 1.6,
        }}
        onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
    </div>
  );
}

function Step1({ form, update }: { form: Form; update: (k: keyof Form, v: any) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Inclusions & Airports</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>What's included and departure options</p>

      <FieldLabel>Included ({form.includes.length})</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {form.includes.map((item, i) => (
          <span key={i} style={{
            background: "rgba(45,212,160,0.1)", border: "1px solid rgba(45,212,160,0.25)",
            borderRadius: 99, padding: "5px 12px", fontSize: 12, color: SUCCESS,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            ✓ {item}
            <button onClick={() => update("includes", form.includes.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(45,212,160,0.5)", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>

      <FieldLabel>Not Included ({form.excludes.length})</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {form.excludes.map((item, i) => (
          <span key={i} style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 99, padding: "5px 12px", fontSize: 12, color: "#ef9090",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            ✕ {item}
            <button onClick={() => update("excludes", form.excludes.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.4)", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>

      <FieldLabel>Departure Airports</FieldLabel>
      {form.airports.map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <TextInput value={a.name} onChange={v => {
            const arr = [...form.airports]; arr[i] = { ...arr[i], name: v }; update("airports", arr);
          }} placeholder="Airport name" />
          <input
            value={a.price}
            onChange={e => {
              const arr = [...form.airports]; arr[i] = { ...arr[i], price: e.target.value }; update("airports", arr);
            }}
            placeholder="Price"
            style={{ width: 90, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "var(--white)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
        </div>
      ))}
      <button onClick={() => update("airports", [...form.airports, { name: "", price: "" }])}
        style={{ fontSize: 12, color: SAND, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
        + Add airport
      </button>
    </div>
  );
}

function Step2({ form, update }: { form: Form; update: (k: keyof Form, v: any) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Day-by-Day Itinerary</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Give travellers a clear journey timeline</p>
      {form.itinerary.map((day, i) => (
        <div key={i} style={{
          display: "flex", gap: 14, marginBottom: 14,
          background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: `${SAND}22`, border: `1px solid ${SAND}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: SAND,
          }}>{day.day}</div>
          <div style={{ flex: 1 }}>
            <input
              value={day.title}
              onChange={e => { const arr = [...form.itinerary]; arr[i] = { ...arr[i], title: e.target.value }; update("itinerary", arr); }}
              placeholder={`Day ${day.day} title`}
              style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, fontFamily: "inherit", outline: "none", marginBottom: 4 }}
            />
            <input
              value={day.desc}
              onChange={e => { const arr = [...form.itinerary]; arr[i] = { ...arr[i], desc: e.target.value }; update("itinerary", arr); }}
              placeholder="Description…"
              style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "inherit", outline: "none" }}
            />
          </div>
        </div>
      ))}
      <button onClick={() => update("itinerary", [...form.itinerary, { day: form.itinerary.length + 1, title: "", desc: "" }])}
        style={{ fontSize: 12, color: SAND, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
        + Add day
      </button>
    </div>
  );
}

function Step3({ form, update }: { form: Form; update: (k: keyof Form, v: any) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Pricing Tiers</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Offer clear options to maximise conversions</p>
      {form.pricingTiers.map((tier, i) => (
        <div key={i} style={{
          background: i === 0 ? `${SAND}12` : "rgba(255,255,255,0.03)",
          border: `1px solid ${i === 0 ? SAND + "40" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 12, padding: "14px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 10,
        }}>
          <div>
            {i === 0 && <span style={{ fontSize: 10, fontWeight: 700, color: SAND, letterSpacing: "0.6px", textTransform: "uppercase" as const, display: "block", marginBottom: 3 }}>Most Popular</span>}
            <input
              value={tier.label}
              onChange={e => { const arr = [...form.pricingTiers]; arr[i] = { ...arr[i], label: e.target.value }; update("pricingTiers", arr); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 500, fontFamily: "inherit", outline: "none" }}
            />
          </div>
          <input
            value={tier.price}
            onChange={e => { const arr = [...form.pricingTiers]; arr[i] = { ...arr[i], price: e.target.value }; update("pricingTiers", arr); }}
            placeholder="€899"
            style={{ width: 80, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: SAND, fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", textAlign: "right" as const }}
          />
        </div>
      ))}
      <FieldLabel>Cancellation Policy</FieldLabel>
      <TextInput value={form.cancellation} onChange={v => update("cancellation", v)} placeholder="Cancellation terms…" />
    </div>
  );
}

function Step4({ form, update }: { form: Form; update: (k: keyof Form, v: any) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Contact & CTAs</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Where should leads reach you?</p>
      <div style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 14, display: "flex", gap: 14, alignItems: "center" }}>
        <Icon name="whatsapp" size={24} color="#25d366" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#25d366", marginBottom: 6 }}>WhatsApp</div>
          <TextInput value={form.whatsapp} onChange={v => update("whatsapp", v)} placeholder="+351 912 345 678" />
        </div>
      </div>
      <div style={{ background: "rgba(0,132,255,0.08)", border: "1px solid rgba(0,132,255,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 14, display: "flex", gap: 14, alignItems: "center" }}>
        <Icon name="messenger" size={24} color="#0084ff" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0084ff", marginBottom: 6 }}>Messenger</div>
          <TextInput value={form.messenger} onChange={v => update("messenger", v)} placeholder="m.me/youragency" />
        </div>
      </div>
      <div style={{ background: "rgba(78,205,196,0.08)", border: "1px solid rgba(78,205,196,0.2)", borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#4ecdc4", marginBottom: 8 }}>Media (optional)</div>
        <div style={{ border: "1.5px dashed rgba(78,205,196,0.3)", borderRadius: 10, padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Icon name="image" size={24} color="rgba(78,205,196,0.4)" />
          <span style={{ fontSize: 12, color: "rgba(78,205,196,0.5)" }}>Drop cover photo or gallery images</span>
          <span style={{ fontSize: 11, color: "rgba(78,205,196,0.3)" }}>JPG, PNG or MP4 · max 10MB each</span>
        </div>
      </div>
    </div>
  );
}

function MiniPreview({ form }: { form: Form }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden", position: "sticky" as const, top: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase" as const, padding: "12px 14px 8px", borderBottom: "1px solid var(--border)" }}>
        Live Preview
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ height: 60, background: "linear-gradient(135deg, #c9713a, #8b4513)", borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "flex-end", padding: "8px 10px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{form.destination || "—"}</div>
        </div>
        <div style={{ fontSize: 11, color: SAND, fontWeight: 700, marginBottom: 6 }}>{form.price || "—"} · {form.nights} nights</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, marginBottom: 10 }}>
          {form.description?.slice(0, 80) || "No description yet…"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {form.includes.slice(0, 3).map((inc, i) => (
            <span key={i} style={{ background: "rgba(45,212,160,0.1)", border: "1px solid rgba(45,212,160,0.2)", borderRadius: 99, padding: "2px 8px", fontSize: 9, color: SUCCESS }}>✓ {inc}</span>
          ))}
        </div>
        <div style={{ background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, borderRadius: 6, padding: "7px", textAlign: "center" as const, fontSize: 10, fontWeight: 700, color: "#0d1b2e" }}>
          Book via WhatsApp
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function BuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<Form>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("packageData");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_FORM,
            destination: parsed.destination || "",
            price: parsed.price || "",
            description: parsed.description || "",
            includes: parsed.advantages?.length ? parsed.advantages : DEFAULT_FORM.includes,
            airports: parsed.airports?.length ? parsed.airports : DEFAULT_FORM.airports,
          };
        } catch {}
      }
    }
    return DEFAULT_FORM;
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { plan: "free", packagesUsed: 0, aiLimit: 10, createdAt: Date.now() });
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const update = (key: keyof Form, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleGenerate = async () => {
    if (!form.destination || !form.price) {
      setError("Destination and price are required.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: user.uid }),
      });
      const json = await res.json();
      if (!res.ok || !json.id) {
        setError(json.error || "Something went wrong.");
        return;
      }
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, { packagesUsed: increment(1) });
      setPackageId(json.id);
      setDone(true);
      localStorage.removeItem("packageData");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const shareUrl = packageId ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${packageId}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" />
        </div>
      </AppLayout>
    );
  }

  if (done && packageId) {
    return (
      <AppLayout>
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 48 }}>
          <div className="fade-up" style={{ textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(45,212,160,0.15)", border: `2px solid ${SUCCESS}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <Icon name="check" size={32} color={SUCCESS} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontFamily: "var(--font-dm-serif), serif", fontSize: 32, marginBottom: 10 }}>Landing page created!</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, maxWidth: 400 }}>
              Your package page is live. Share the link and start tracking leads.
            </p>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "12px 18px",
            display: "flex", alignItems: "center", gap: 12, maxWidth: 480, width: "100%",
          }}>
            <Icon name="link" size={16} color={SAND} />
            <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {shareUrl}
            </span>
            <button onClick={handleCopy} style={{
              background: `${SAND}22`, border: `1px solid ${SAND}40`,
              borderRadius: 8, padding: "5px 12px", fontSize: 12, color: copied ? SUCCESS : SAND,
              cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
            }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => router.push(`/p/${packageId}`)} style={{
              background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              color: "#0d1b2e", border: "none", borderRadius: 10,
              padding: "11px 24px", fontSize: 14, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon name="eye" size={16} color="#0d1b2e" /> Preview Landing Page
            </button>
            <button onClick={() => router.push("/dashboard")} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              color: "rgba(255,255,255,0.7)", borderRadius: 10,
              padding: "11px 24px", fontSize: 14, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
            }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ flex: 1, overflow: "auto", padding: "40px 48px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Package Builder</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Complete all steps to generate your landing page</p>
          </div>
          <div style={{
            background: `${SAND}18`, border: `1px solid ${SAND}35`,
            borderRadius: 99, padding: "5px 14px", fontSize: 12, color: SAND,
            display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
          }}>
            <Icon name="sparkle" size={12} color={SAND} />
            AI pre-filled from your post
          </div>
        </div>

        {/* Step pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              padding: "7px 16px", borderRadius: 99,
              border: i === step ? `1.5px solid ${SAND}` : "1px solid rgba(255,255,255,0.1)",
              background: i === step ? `${SAND}18` : i < step ? "rgba(45,212,160,0.08)" : "transparent",
              color: i === step ? SAND : i < step ? SUCCESS : "rgba(255,255,255,0.4)",
              fontSize: 12, fontWeight: i === step ? 700 : 500,
              fontFamily: "inherit", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
            }}>
              {i < step && <Icon name="check" size={11} color={SUCCESS} strokeWidth={2.5} />}
              {s}
            </button>
          ))}
        </div>

        {/* Step content + mini preview */}
        <div style={{ display: "flex", gap: 32 }}>
          <div className="fade-in" key={step} style={{ flex: 1, maxWidth: 560 }}>
            {step === 0 && <Step0 form={form} update={update} />}
            {step === 1 && <Step1 form={form} update={update} />}
            {step === 2 && <Step2 form={form} update={update} />}
            {step === 3 && <Step3 form={form} update={update} />}
            {step === 4 && <Step4 form={form} update={update} />}
          </div>
          <div style={{ width: 260, flexShrink: 0 }}>
            <MiniPreview form={form} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--danger)" }}>{error}</p>
        )}

        {/* Nav buttons */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)",
        }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "10px 20px", color: "rgba(255,255,255,0.5)",
            fontSize: 13, fontFamily: "inherit", cursor: step === 0 ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6, opacity: step === 0 ? 0.3 : 1,
          }}>
            <Icon name="arrow_left" size={14} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} style={{
              background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              color: "#0d1b2e", border: "none", borderRadius: 10,
              padding: "10px 24px", fontSize: 13, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              Continue <Icon name="arrow_right" size={14} color="#0d1b2e" strokeWidth={2.5} />
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={generating} style={{
              background: generating ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              color: generating ? "rgba(255,255,255,0.4)" : "#0d1b2e",
              border: "none", borderRadius: 10,
              padding: "10px 28px", fontSize: 13, fontWeight: 700,
              fontFamily: "inherit", cursor: generating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {generating
                ? <><span className="spinner" style={{ borderTopColor: SAND }} /> Generating…</>
                : <><Icon name="sparkle" size={14} color="#0d1b2e" strokeWidth={2.5} /> Generate Landing Page</>
              }
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
