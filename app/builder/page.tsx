"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { T, type Lang } from "@/lib/translations";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import posthog from "posthog-js";
import { FREE_PACKAGE_LIMIT, FREE_AI_LIMIT } from "@/lib/limits";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";
const DRAFT_KEY = "builderDraft";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function toLocalDigits(n: number | string, lang: Lang): string {
  if (lang !== "ar") return String(n);
  return String(n).replace(/\d/g, d => AR_DIGITS[+d]);
}

type TDict = typeof T["en"];

type Airport = { name: string; price: string; date?: string; arrivingAirport?: string; flyingTime?: string; arrivingTime?: string };
type ItineraryDay = { day: number; title: string; desc: string };
type PricingTier = { label: string; price: string };

type Form = {
  destination: string;
  price: string;
  nights: string;
  title: string;
  description: string;
  includes: string[];
  excludes: string[];
  hotelDescription: string;
  airports: Airport[];
  itinerary: ItineraryDay[];
  pricingTiers: PricingTier[];
  cancellation: string;
  whatsapp: string;
  messenger: string;
  coverImage: string;
  images: string[];
  videoUrl: string;
  language: "en" | "ar";
};

const DEFAULT_FORM: Form = {
  destination: "",
  price: "",
  nights: "5",
  title: "",
  description: "",
  includes: [],
  excludes: [],
  hotelDescription: "",
  airports: [{ name: "", price: "", date: "" }],
  itinerary: [
    { day: 1, title: "", desc: "" },
    { day: 2, title: "", desc: "" },
    { day: 3, title: "", desc: "" },
  ],
  pricingTiers: [
    { label: "Per person (2 pax)", price: "" },
    { label: "Solo traveller", price: "" },
    { label: "Child (2–11 years)", price: "" },
    { label: "Infant (under 2 years)", price: "" },
  ],
  cancellation: "Free cancellation up to 30 days before departure",
  whatsapp: "",
  messenger: "",
  coverImage: "",
  images: [],
  videoUrl: "",
  language: "en",
};

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

function ComingSoonPanel({ feature, featureKey, user, onBack, t }: { feature: string; featureKey: string; user: any; onBack?: () => void; t: TDict }) {
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, "featureRequests"), {
        feature: featureKey,
        userId: user?.uid || "anonymous",
        email: user?.email || "",
        createdAt: Date.now(),
      });
      setRequested(true);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", padding: "36px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${SAND}18`, border: `1px solid ${SAND}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>✦</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t.comingSoonTitle}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 24 }}>
        <b style={{ color: "#fff" }}>{feature}</b> {t.comingSoonInDev}<br />{t.comingSoonTellUs}
      </div>
      {requested ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "rgba(45,212,160,0.1)", border: "1px solid rgba(45,212,160,0.3)", color: SUCCESS, fontSize: 13, fontWeight: 600 }}>
          {t.onTheList}
        </div>
      ) : (
        <button
          onClick={handleRequest}
          disabled={loading}
          style={{ padding: "11px 24px", borderRadius: 10, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, border: "none", color: "#0a1426", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          {loading ? <span className="spinner" style={{ width: 13, height: 13, borderTopColor: "#0a1426" }} /> : "⚡"} {t.iWantFaster}
        </button>
      )}
      {onBack && (
        <div>
          <button onClick={onBack} style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>{t.goBack}</button>
        </div>
      )}
    </div>
  );
}

function Step0({ form, update, t }: { form: Form; update: (k: keyof Form, v: any) => void; t: TDict }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.stepBasicsTitle}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{t.stepBasicsSub}</p>

      {/* Language picker */}
      <FieldLabel>{t.landingLanguage}</FieldLabel>
      <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
        {(["en", "ar"] as const).map(l => (
          <button
            key={l}
            onClick={() => update("language", l)}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 10,
              border: form.language === l ? `1.5px solid ${SAND}` : "1px solid rgba(255,255,255,0.1)",
              background: form.language === l ? `${SAND}18` : "rgba(255,255,255,0.03)",
              color: form.language === l ? SAND : "rgba(255,255,255,0.5)",
              fontSize: 13, fontWeight: form.language === l ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.15s",
            }}
          >
            {l === "en" ? (
              <><span style={{ fontSize: 15 }}>🇬🇧</span> {t.langEn}</>
            ) : (
              <><span style={{ fontSize: 15 }}>🇸🇦</span> {t.langAr}</>
            )}
          </button>
        ))}
      </div>
      {form.language === "ar" && (
        <div style={{ marginBottom: 16, padding: "8px 12px", borderRadius: 8, background: "rgba(232,201,123,0.06)", border: "1px solid rgba(232,201,123,0.18)", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          {t.rtlHint}
        </div>
      )}

      <FieldLabel>{t.fieldDestination}</FieldLabel>
      <TextInput value={form.destination} onChange={v => update("destination", v)} placeholder={t.placeholderDestination} />
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>{t.fieldBasePrice}</FieldLabel>
          <TextInput value={form.price} onChange={v => update("price", v)} placeholder={t.placeholderBasePrice} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>{t.fieldNights}</FieldLabel>
          <TextInput value={form.nights} onChange={v => update("nights", v)} placeholder={t.placeholderNights} />
        </div>
      </div>
      <FieldLabel>{t.fieldTitle}</FieldLabel>
      <TextInput value={form.title} onChange={v => update("title", v)} placeholder={t.titlePlaceholder} />

      <FieldLabel>{t.fieldDescription}</FieldLabel>
      <textarea
        value={form.description}
        onChange={e => update("description", e.target.value)}
        placeholder={t.descPlaceholder}
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
      <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(232,201,123,0.06)", border: "1px solid rgba(232,201,123,0.2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(232,201,123,0.18)", color: SAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
        <div style={{ flex: 1, fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>
          <b style={{ color: "#fff" }}>{t.coachingTipLabel}</b> {t.coachingTipBody}
        </div>
      </div>
    </div>
  );
}

function TagInput({ value, onAdd, t }: { value: string[]; onAdd: (v: string[]) => void; t: TDict }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) onAdd([...value, trimmed]);
    setDraft("");
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
        placeholder={t.tagInputPlaceholder}
        style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", color: "var(--white)", fontSize: 12, fontFamily: "inherit", outline: "none" }}
        onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
      />
      <button onClick={commit} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>{t.addBtn}</button>
    </div>
  );
}

function Step1({ form, update, t }: { form: Form; update: (k: keyof Form, v: any) => void; t: TDict }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.stepDetailsTitle}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{t.stepDetailsSub}</p>

      <FieldLabel>{t.fieldIncluded}</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
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
      <TagInput value={form.includes} onAdd={v => update("includes", v)} t={t} />

      <FieldLabel>{t.fieldNotIncluded}</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
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
      <TagInput value={form.excludes} onAdd={v => update("excludes", v)} t={t} />

      <FieldLabel>{t.fieldHotelDescription}</FieldLabel>
      <textarea
        value={form.hotelDescription}
        onChange={e => update("hotelDescription", e.target.value)}
        placeholder={t.hotelDescriptionPlaceholder}
        style={{
          width: "100%", minHeight: 100,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "10px 14px", color: "var(--white)",
          fontSize: 13, fontFamily: "inherit", outline: "none",
          resize: "vertical" as const, lineHeight: 1.6,
        }}
        onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />

      <FieldLabel>{t.fieldDepartureAirports}</FieldLabel>
      {form.airports.map((a, i) => (
        <div key={i} style={{ marginBottom: 12, padding: "14px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", position: "relative" }}>
          <button onClick={() => update("airports", form.airports.filter((_, j) => j !== i))} style={{ position: "absolute", top: 6, right: 8, width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>×</button>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <TextInput value={a.name} onChange={v => {
              const arr = [...form.airports]; arr[i] = { ...arr[i], name: v }; update("airports", arr);
            }} placeholder={t.airportNamePlaceholder} />
            <input
              value={a.price}
              onChange={e => {
                const arr = [...form.airports]; arr[i] = { ...arr[i], price: e.target.value }; update("airports", arr);
              }}
              placeholder={t.placeholderAirportPrice}
              style={{ width: 90, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "var(--white)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <TextInput value={a.arrivingAirport || ""} onChange={v => {
              const arr = [...form.airports]; arr[i] = { ...arr[i], arrivingAirport: v }; update("airports", arr);
            }} placeholder={t.airportArrivingPlaceholder} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>↑</span>
              <input
                value={a.flyingTime || ""}
                onChange={e => {
                  const arr = [...form.airports]; arr[i] = { ...arr[i], flyingTime: e.target.value }; update("airports", arr);
                }}
                placeholder={t.flyingTimePlaceholder}
                style={{ flex: 1, background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "4px 0", color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontFamily: "inherit", outline: "none" }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>↓</span>
              <input
                value={a.arrivingTime || ""}
                onChange={e => {
                  const arr = [...form.airports]; arr[i] = { ...arr[i], arrivingTime: e.target.value }; update("airports", arr);
                }}
                placeholder={t.arrivingTimePlaceholder}
                style={{ flex: 1, background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "4px 0", color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontFamily: "inherit", outline: "none" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={13} color="rgba(255,255,255,0.3)" />
            <input
              value={a.date || ""}
              onChange={e => {
                const arr = [...form.airports]; arr[i] = { ...arr[i], date: e.target.value }; update("airports", arr);
              }}
              placeholder={t.airportDatePlaceholder}
              style={{ flex: 1, background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "4px 0", color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontFamily: "inherit", outline: "none" }}
            />
          </div>
        </div>
      ))}
      <button onClick={() => update("airports", [...form.airports, { name: "", price: "", date: "", arrivingAirport: "", flyingTime: "", arrivingTime: "" }])}
        style={{ fontSize: 12, color: SAND, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
        {t.addAirport}
      </button>
    </div>
  );
}

function Step2({ form, update, t, lang }: { form: Form; update: (k: keyof Form, v: any) => void; t: TDict; lang: Lang }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.stepItineraryTitle}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{t.stepItinerarySub}</p>
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
          }}>{toLocalDigits(day.day, lang)}</div>
          <div style={{ flex: 1 }}>
            <input
              value={day.title}
              onChange={e => { const arr = [...form.itinerary]; arr[i] = { ...arr[i], title: e.target.value }; update("itinerary", arr); }}
              placeholder={`${t.dayLabel} ${toLocalDigits(day.day, lang)}`}
              style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, fontFamily: "inherit", outline: "none", marginBottom: 4 }}
            />
            <input
              value={day.desc}
              onChange={e => { const arr = [...form.itinerary]; arr[i] = { ...arr[i], desc: e.target.value }; update("itinerary", arr); }}
              placeholder={t.dayDescPlaceholder}
              style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "inherit", outline: "none" }}
            />
          </div>
        </div>
      ))}
      <button onClick={() => update("itinerary", [...form.itinerary, { day: form.itinerary.length + 1, title: "", desc: "" }])}
        style={{ fontSize: 12, color: SAND, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
        {t.addDay}
      </button>
    </div>
  );
}

function Step3({ form, update, t }: { form: Form; update: (k: keyof Form, v: any) => void; t: TDict }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.stepPricingTitle}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{t.stepPricingSub}</p>
      {form.pricingTiers.map((tier, i) => (
        <div key={i} style={{
          background: i === 0 ? `${SAND}12` : "rgba(255,255,255,0.03)",
          border: `1px solid ${i === 0 ? SAND + "40" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 12, padding: "14px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 10,
        }}>
          <div>
            {i === 0 && <span style={{ fontSize: 10, fontWeight: 700, color: SAND, letterSpacing: "0.6px", textTransform: "uppercase" as const, display: "block", marginBottom: 3 }}>{t.mostPopularLabel}</span>}
            <input
              value={tier.label}
              onChange={e => { const arr = [...form.pricingTiers]; arr[i] = { ...arr[i], label: e.target.value }; update("pricingTiers", arr); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 500, fontFamily: "inherit", outline: "none" }}
            />
          </div>
          <input
            value={tier.price}
            onChange={e => { const arr = [...form.pricingTiers]; arr[i] = { ...arr[i], price: e.target.value }; update("pricingTiers", arr); }}
            placeholder={t.priceTierPlaceholder}
            style={{ width: 80, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: SAND, fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", textAlign: "right" as const }}
          />
        </div>
      ))}
      <FieldLabel>{t.fieldCancellation}</FieldLabel>
      <TextInput value={form.cancellation} onChange={v => update("cancellation", v)} placeholder={t.cancellationPlaceholder} />
    </div>
  );
}

function Step4({ form, update, t }: { form: Form; update: (k: keyof Form, v: any) => void; t: TDict }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.stepContactTitle}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{t.stepContactSub}</p>
      <div style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 14, display: "flex", gap: 14, alignItems: "center" }}>
        <Icon name="whatsapp" size={24} color="#25d366" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#25d366", marginBottom: 6 }}>WhatsApp</div>
          <TextInput value={form.whatsapp} onChange={v => update("whatsapp", v)} placeholder={t.whatsappPlaceholder} />
        </div>
      </div>
      <div style={{ background: "rgba(0,132,255,0.08)", border: "1px solid rgba(0,132,255,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 14, display: "flex", gap: 14, alignItems: "center" }}>
        <Icon name="messenger" size={24} color="#0084ff" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0084ff", marginBottom: 6 }}>Messenger</div>
          <TextInput value={form.messenger} onChange={v => update("messenger", v)} placeholder={t.placeholderMessenger} />
        </div>
      </div>
    </div>
  );
}

const COVER_W = 1920;
const COVER_H = 1080;
const COVER_RATIO = COVER_W / COVER_H;

// ── Pexels search panels ──────────────────────────────────────────────────────

const TAB_BTN = (active: boolean) => ({
  padding: "6px 16px", borderRadius: 99 as const, border: "none",
  background: active ? "rgba(255,255,255,0.12)" : "transparent",
  color: active ? "#fff" : "rgba(255,255,255,0.4)",
  fontSize: 12, fontWeight: active ? 600 : 400,
  fontFamily: "inherit", cursor: "pointer" as const,
  display: "flex" as const, alignItems: "center" as const, gap: 6,
});

function PexelsPhotoSearch({ onSelect, placeholder, attribution, t }: {
  onSelect: (url: string) => void;
  placeholder: string;
  attribution: string;
  t: TDict;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/pexels/photos?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.photos || []);
    } catch {}
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder={placeholder}
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "var(--white)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        <button
          onClick={search}
          disabled={loading}
          style={{ padding: "10px 18px", borderRadius: 10, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: "#0a1426", fontWeight: 700, fontSize: 13, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? <span className="spinner" style={{ width: 13, height: 13, borderTopColor: "#0a1426" }} />
            : <><Icon name="image" size={13} color="#0a1426" /> {t.pexelsSearchBtn}</>
          }
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <span className="spinner" style={{ borderTopColor: SAND }} />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{t.pexelsNoResults}</div>
      )}

      {results.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {results.map(photo => (
              <div
                key={photo.id}
                onClick={() => onSelect(photo.src.large2x || photo.src.large)}
                title={photo.photographer}
                style={{ position: "relative", aspectRatio: "4/3", borderRadius: 9, overflow: "hidden", cursor: "pointer" }}
                onMouseEnter={e => { const o = e.currentTarget.querySelector(".px-overlay") as HTMLElement; if (o) o.style.opacity = "1"; }}
                onMouseLeave={e => { const o = e.currentTarget.querySelector(".px-overlay") as HTMLElement; if (o) o.style.opacity = "0"; }}
              >
                <img src={photo.src.medium} alt={photo.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div className="px-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0, transition: "opacity .15s" }}>
                  <Icon name="check" size={18} color="#fff" strokeWidth={2.5} />
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>Use photo</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.2)", textAlign: "right" }}>
            {attribution} ·{" "}
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>pexels.com</a>
            {" "}·{" "}
            <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>pixabay.com</a>
          </div>
        </>
      )}
    </div>
  );
}

function PexelsVideoSearch({ onSelect, t }: { onSelect: (url: string) => void; t: TDict }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/pexels/videos?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.videos || []);
    } catch {}
    setLoading(false);
  };

  const getBestMp4 = (video: any): string => {
    const files: any[] = video.video_files || [];
    const hd = files.find(f => f.quality === "hd" && f.file_type === "video/mp4");
    const sd = files.find(f => f.file_type === "video/mp4");
    return (hd || sd)?.link || "";
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder={t.pexelsSearchVideos}
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "var(--white)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        <button
          onClick={search}
          disabled={loading}
          style={{ padding: "10px 18px", borderRadius: 10, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: "#0a1426", fontWeight: 700, fontSize: 13, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? <span className="spinner" style={{ width: 13, height: 13, borderTopColor: "#0a1426" }} />
            : <><Icon name="video" size={13} color="#0a1426" /> {t.pexelsSearchBtn}</>
          }
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <span className="spinner" style={{ borderTopColor: SAND }} />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{t.pexelsNoResults}</div>
      )}

      {results.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {results.map(video => {
              const mp4 = getBestMp4(video);
              return (
                <div
                  key={video.id}
                  onClick={() => mp4 && onSelect(mp4)}
                  style={{ position: "relative", aspectRatio: "16/9", borderRadius: 9, overflow: "hidden", cursor: mp4 ? "pointer" : "default", background: "#0d1b2e" }}
                  onMouseEnter={e => { const o = e.currentTarget.querySelector(".px-overlay") as HTMLElement; if (o) o.style.opacity = "1"; }}
                  onMouseLeave={e => { const o = e.currentTarget.querySelector(".px-overlay") as HTMLElement; if (o) o.style.opacity = "0"; }}
                >
                  <img src={video.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.88)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#0d1b2e"><polygon points="5,3 19,12 5,21" /></svg>
                    </div>
                  </div>
                  <div className="px-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0, transition: "opacity .15s", flexDirection: "column" }}>
                    <Icon name="check" size={18} color="#fff" strokeWidth={2.5} />
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>Use video</span>
                  </div>
                  <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 600, background: "rgba(0,0,0,0.45)", borderRadius: 4, padding: "1px 5px" }}>{Math.floor(video.duration)}s</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.2)", textAlign: "right" }}>
            {t.pexelsVideosAttribution} ·{" "}
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>pexels.com</a>
            {" "}·{" "}
            <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>pixabay.com</a>
          </div>
        </>
      )}
    </div>
  );
}

// ── Step components ───────────────────────────────────────────────────────────

function StepCover({ form, update, user, t }: { form: Form; update: (k: keyof Form, v: any) => void; user: any; t: TDict }) {
  const [mode, setMode] = useState<"upload" | "pexels">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(null);

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    await new Promise<void>(resolve => { img.onload = () => resolve(); });
    URL.revokeObjectURL(objectUrl);

    if (img.width < 1200 || img.height < 675) {
      setError(`Image too small (${img.width}×${img.height}px). Minimum is 1200×675px (16:9).`);
      e.target.value = "";
      return;
    }
    const ratio = img.width / img.height;
    if (ratio < 1.6 || ratio > 2.0) {
      setError(`Please use a landscape image close to 16:9 ratio. Yours is ${img.width}×${img.height}px.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("uid", user.uid);
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      update("coverImage", json.urls[0]);
    } catch {
      setError(t.uploadFailed);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.stepCoverTitle}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{t.stepCoverSub}</p>

      {/* Current cover preview */}
      {form.coverImage && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: `${COVER_RATIO}`, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
            <img src={form.coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Icon name="check" size={14} color={SUCCESS} strokeWidth={2.5} />
            <span style={{ fontSize: 13, color: SUCCESS, fontWeight: 600 }}>{t.coverImageSet}</span>
            <button onClick={() => update("coverImage", "")} style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {t.coverRemove}
            </button>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "4px 5px", marginBottom: 16, gap: 4 }}>
        <button onClick={() => setMode("upload")} style={TAB_BTN(mode === "upload")}>
          <Icon name="image" size={12} color={mode === "upload" ? "white" : "rgba(255,255,255,0.4)"} /> {t.mediaUploadTab}
        </button>
        <button onClick={() => setMode("pexels")} style={TAB_BTN(mode === "pexels")}>
          <Icon name="image" size={12} color={mode === "pexels" ? SAND : "rgba(255,255,255,0.4)"} />
          <span style={{ color: mode === "pexels" ? SAND : undefined }}>{t.mediaPexelsPhotoTab}</span>
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 12 }}>{error}</p>}

      {mode === "upload" ? (
        <>
          {!form.coverImage && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${SAND}15`, border: `1px solid ${SAND}30`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: SAND, fontWeight: 600, marginBottom: 14 }}>
              <Icon name="image" size={11} color={SAND} /> {t.coverRatioHint}
            </div>
          )}
          <label style={{
            display: "block", cursor: uploading ? "not-allowed" : "pointer",
            border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 14,
            overflow: "hidden", transition: "border-color 0.2s",
          }}
            onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = `${SAND}50`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
          >
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} disabled={uploading} />
            <div style={{ position: "relative", width: "100%", paddingTop: `${(1 / COVER_RATIO) * 100}%`, background: "rgba(255,255,255,0.02)" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {uploading ? (
                  <><span className="spinner" style={{ borderTopColor: SAND }} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{t.uploadingLabel}</span></>
                ) : (
                  <>
                    <Icon name="image" size={32} color="rgba(255,255,255,0.15)" />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>{t.coverClickUpload}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{t.coverDimHint}</div>
                  </>
                )}
              </div>
            </div>
          </label>
        </>
      ) : (
        <PexelsPhotoSearch
          onSelect={url => { update("coverImage", url); setMode("upload"); }}
          placeholder={t.pexelsSearchPhotos}
          attribution={t.pexelsAttribution}
          t={t}
        />
      )}
    </div>
  );
}

function Step5({ form, update, user, t, lang }: { form: Form; update: (k: keyof Form, v: any) => void; user: any; t: TDict; lang: Lang }) {
  const [mode, setMode] = useState<"upload" | "pexels" | "generate">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("uid", user.uid);
      files.forEach(f => fd.append("file", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      update("images", [...form.images, ...(json.urls as string[])]);
    } catch {
      setError(t.uploadFailed);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (i: number) => update("images", form.images.filter((_, j) => j !== i));

  const handleDragStart = (i: number) => { dragIndex.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDrop = (i: number) => {
    const from = dragIndex.current;
    if (from === null || from === i) { dragIndex.current = null; setDragOverIndex(null); return; }
    const imgs = [...form.images];
    const [moved] = imgs.splice(from, 1);
    imgs.splice(i, 0, moved);
    update("images", imgs);
    dragIndex.current = null;
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { dragIndex.current = null; setDragOverIndex(null); };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.stepMediaTitle}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{t.stepMediaSub}</p>

      <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "4px 5px", marginBottom: 20, gap: 4 }}>
        <button onClick={() => setMode("upload")} style={TAB_BTN(mode === "upload")}>
          <Icon name="image" size={12} color={mode === "upload" ? "white" : "rgba(255,255,255,0.4)"} /> {t.mediaUploadTab}
        </button>
        <button onClick={() => setMode("pexels")} style={TAB_BTN(mode === "pexels")}>
          <Icon name="image" size={12} color={mode === "pexels" ? SAND : "rgba(255,255,255,0.4)"} />
          <span style={{ color: mode === "pexels" ? SAND : undefined }}>{t.mediaPexelsPhotoTab}</span>
        </button>
        <button onClick={() => setMode("generate")} style={TAB_BTN(mode === "generate")}>
          <Icon name="sparkle" size={12} color={mode === "generate" ? SAND : "rgba(255,255,255,0.4)"} /> {t.mediaGenerateTab}
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 12 }}>{error}</p>}

      {/* Always show current gallery */}
      {form.images.length > 0 && mode !== "generate" && (
        <>
          {mode === "upload" && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(45,212,160,0.06)", border: "1px solid rgba(45,212,160,0.2)", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>
              💡 {t.mediaBoostTip} <b style={{ color: SUCCESS }}>{toLocalDigits(form.images.length, lang)}</b>.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
            {form.images.map((url, i) => (
              <div
                key={url + i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                style={{
                  position: "relative", aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", cursor: "grab",
                  boxShadow: i === 0 ? `0 0 0 2px ${SAND}80` : "none",
                  opacity: dragOverIndex === i ? 0.5 : 1,
                  outline: dragOverIndex === i ? `2px dashed ${SAND}` : "none",
                  transition: "opacity 0.15s, outline 0.15s",
                }}
              >
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                {i === 0 && (
                  <div style={{ position: "absolute", top: 7, left: 7, background: `${SAND}ee`, color: "#0a1426", borderRadius: 5, padding: "2px 7px", fontSize: 9, fontWeight: 800, letterSpacing: ".4px" }}>HERO</div>
                )}
                <button onClick={() => removeImage(i)} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}

      {mode === "upload" && (
        <label style={{ display: "block", border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 14, padding: "32px 24px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = `${SAND}50`)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
        >
          <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
          {uploading ? (
            <><span className="spinner" style={{ borderTopColor: SAND }} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>{t.uploadingLabel}</span></>
          ) : (
            <>
              <Icon name="image" size={28} color="rgba(255,255,255,0.2)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginTop: 10 }}>{t.mediaClickUpload}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{t.mediaFormatHint}</div>
            </>
          )}
        </label>
      )}

      {mode === "pexels" && (
        <PexelsPhotoSearch
          onSelect={url => update("images", [...form.images, url])}
          placeholder={t.pexelsSearchPhotos}
          attribution={t.pexelsAttribution}
          t={t}
        />
      )}

      {mode === "generate" && (
        <ComingSoonPanel feature={t.mediaGenerateTab} featureKey="ai-images" user={user} onBack={() => setMode("upload")} t={t} />
      )}
    </div>
  );
}

function Step6({ form, update, user, t }: { form: Form; update: (k: keyof Form, v: any) => void; user: any; t: TDict }) {
  const [mode, setMode] = useState<"upload" | "pexels" | "generate">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("uid", user.uid);
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      update("videoUrl", json.urls[0]);
    } catch {
      setError(t.uploadFailed);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.stepVideoTitle}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{t.stepVideoSub}</p>

      {/* Current video preview */}
      {form.videoUrl && (
        <div style={{ marginBottom: 16 }}>
          <video src={form.videoUrl} controls style={{ width: "100%", borderRadius: 12, background: "#0d1b2e", maxHeight: 260 }} />
          <button onClick={() => update("videoUrl", "")} style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {t.videoRemove}
          </button>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "4px 5px", marginBottom: 16, gap: 4 }}>
        <button onClick={() => setMode("upload")} style={TAB_BTN(mode === "upload")}>
          <Icon name="video" size={12} color={mode === "upload" ? "white" : "rgba(255,255,255,0.4)"} /> {t.mediaUploadTab}
        </button>
        <button onClick={() => setMode("pexels")} style={TAB_BTN(mode === "pexels")}>
          <Icon name="video" size={12} color={mode === "pexels" ? SAND : "rgba(255,255,255,0.4)"} />
          <span style={{ color: mode === "pexels" ? SAND : undefined }}>{t.mediaPexelsVideoTab}</span>
        </button>
        <button onClick={() => setMode("generate")} style={TAB_BTN(mode === "generate")}>
          <Icon name="sparkle" size={12} color={mode === "generate" ? SAND : "rgba(255,255,255,0.4)"} /> {t.generateAiVideo}
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 12 }}>{error}</p>}

      {mode === "upload" && (
        <label style={{ display: "block", border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 14, padding: "32px 24px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = `${SAND}50`)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
        >
          <input type="file" accept="video/*" hidden onChange={handleFileChange} />
          {uploading ? (
            <><span className="spinner" style={{ borderTopColor: SAND }} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>{t.uploadingLabel}</span></>
          ) : (
            <>
              <Icon name="video" size={28} color="rgba(255,255,255,0.2)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginTop: 10 }}>{t.videoClickUpload}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{t.videoFormatHint}</div>
            </>
          )}
        </label>
      )}

      {mode === "pexels" && (
        <PexelsVideoSearch
          onSelect={url => { update("videoUrl", url); setMode("upload"); }}
          t={t}
        />
      )}

      {mode === "generate" && (
        <ComingSoonPanel feature={t.generateAiVideo} featureKey="ai-video" user={user} onBack={() => setMode("upload")} t={t} />
      )}
    </div>
  );
}

function StepPaste({ onExtracted, onNext, t, lang }: {
  onExtracted: (d: Partial<Form>) => void;
  onNext: () => void;
  t: TDict;
  lang: Lang;
}) {
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!text.trim()) { onNext(); return; }
    setExtracting(true);
    setErr(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Extraction failed");
      onExtracted({
        destination: json.destination || "",
        price:       json.price       || "",
        title:       json.title       || "",
        description: json.description || "",
        includes:    Array.isArray(json.advantages) ? json.advantages : [],
        airports:    Array.isArray(json.airports) && json.airports.length
                       ? json.airports : [{ name: "", price: "" }],
      });
      onNext();
    } catch (e: any) {
      setErr(e.message || "Extraction failed. Please try again.");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.stepPasteTitle}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{t.stepPasteSub}</p>
      <FieldLabel>{t.stepPasteLabel}</FieldLabel>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t.pastePlaceholderText}
        style={{
          width: "100%", minHeight: 200,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "12px 14px", color: "var(--white)",
          fontSize: 13, fontFamily: "inherit", outline: "none",
          resize: "vertical" as const, lineHeight: 1.6,
        }}
        onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
      {err && <p style={{ fontSize: 12, color: "#ef9090", marginTop: 8 }}>{err}</p>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>
          {text.length > 0
            ? `${toLocalDigits(text.length, lang)} ${t.pasteCharsLabel} · ~${toLocalDigits(Math.ceil(text.length / 240), lang)}${t.pasteSecsToExtract}`
            : t.pasteFormatHint}
        </div>
        <button
          onClick={handleExtract}
          disabled={extracting}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: extracting ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
            color: extracting ? "rgba(255,255,255,0.4)" : "#0d1b2e",
            border: "none", cursor: extracting ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}
        >
          {extracting
            ? <><span className="spinner" style={{ borderTopColor: SAND }} /> {t.extractingLabel}</>
            : <><Icon name="sparkle" size={14} color="#0d1b2e" /> {t.extractWithAi}</>
          }
        </button>
      </div>
    </div>
  );
}

function MiniPreview({ form, t, lang }: { form: Form; t: TDict; lang: Lang }) {
  const heroUrl = form.coverImage || form.images[0];
  const score = Math.min(100,
    (form.destination ? 10 : 0) +
    (form.price ? 10 : 0) +
    (form.title ? 10 : 0) +
    (form.description ? 10 : 0) +
    (form.includes.length > 0 ? 10 : 0) +
    (form.itinerary.some(d => d.title) ? 15 : 0) +
    (form.whatsapp ? 15 : 0) +
    (heroUrl ? 20 : 0)
  );
  const scoreColor = score >= 80 ? SUCCESS : score >= 50 ? SAND : "#f5a623";

  return (
    <div style={{
      background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18, padding: 14, position: "sticky" as const, top: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: ".7px", textTransform: "uppercase" as const }}>{t.livePreviewLabel2}</span>
        <div style={{ display: "inline-flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 99, padding: 2 }}>
          <button style={{ padding: "3px 9px", border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 10, cursor: "pointer", borderRadius: 99, fontFamily: "inherit" }}>📱</button>
          <button style={{ padding: "3px 9px", border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer", borderRadius: 99, fontFamily: "inherit" }}>💻</button>
        </div>
      </div>

      <div style={{
        width: "100%", aspectRatio: "9/19", background: "#0a1426",
        borderRadius: 24, border: "6px solid #1a2438", overflow: "hidden",
        position: "relative" as const,
      }}>
        <div style={{
          height: "42%", position: "relative" as const,
          background: heroUrl
            ? `url(${heroUrl}) center/cover`
            : "linear-gradient(135deg, #1f5f8e, #0e3a5c)",
        }}>
          <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7))" }} />
          <div style={{ position: "absolute" as const, left: 12, right: 12, bottom: 10, color: "#fff" }}>
            <div style={{ fontSize: 8, opacity: 0.7, marginBottom: 3, letterSpacing: ".5px", textTransform: "uppercase" as const }}>
              {toLocalDigits(form.nights, lang)} {t.nightsLabel} · {form.price || "—"}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, lineHeight: 1.1 }}>
              {form.title || form.destination || t.yourDestination}
            </div>
          </div>
        </div>

        <div style={{ padding: "10px 12px", background: "#fdfcf9", height: "58%" }}>
          {form.description && (
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 10, lineHeight: 1.3, marginBottom: 7, color: "#0d1b2e" }}>
              {form.description.slice(0, 60)}{form.description.length > 60 ? "…" : ""}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 3, marginBottom: 8 }}>
            {form.includes.slice(0, 2).map((inc, i) => (
              <span key={i} style={{ fontSize: 6.5, background: "rgba(13,27,46,0.07)", borderRadius: 99, padding: "2px 6px", color: "#0d1b2e" }}>✓ {inc}</span>
            ))}
          </div>
          <div style={{ background: "#25d366", color: "#fff", borderRadius: 6, padding: "6px", textAlign: "center" as const, fontSize: 9, fontWeight: 700 }}>
            {form.whatsapp ? t.bookOnWhatsApp : t.contactUsLabel}
          </div>
          {form.pricingTiers.some(tier => tier.price) && (
            <div style={{ textAlign: "center" as const, fontSize: 6.5, color: "rgba(13,27,46,0.5)", marginTop: 5 }}>
              {t.from} {form.pricingTiers.find(tier => tier.price)?.price}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(232,201,123,0.07)", border: "1px solid rgba(232,201,123,0.2)", borderRadius: 9, fontSize: 10.5, color: "rgba(255,255,255,0.65)", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: SAND }}>✦</span>
        <span>
          <b style={{ color: scoreColor }}>Score: {toLocalDigits(score, lang)}/100</b>
          {" · "}{score >= 80 ? t.scoreLookingStrong : score >= 50 ? t.scoreKeepFilling : t.scoreAddDetails}
        </span>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

function BuilderPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const lang = useLang();
  const t = T[lang];
  const isMobile = useIsMobile();

  const STEPS = [t.stepPaste, t.stepBasics, t.stepDetails, t.stepItinerary, t.stepPricing, t.stepContact, t.stepCover, t.stepMedia, t.stepVideo];

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step, setStep] = useState(isEditMode ? 1 : 0);
  const [extracted, setExtracted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [agencySlug, setAgencySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [form, setForm] = useState<Form>(() => {
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem("packmetrix_lang") as "en" | "ar" | null;
      const initLang: "en" | "ar" = storedLang === "ar" ? "ar" : "en";
      const initT = T[initLang];
      const langDefaults: Partial<Form> = {
        language: initLang,
        pricingTiers: [
          { label: initT.priceTierLabel0, price: "" },
          { label: initT.priceTierLabel1, price: "" },
          { label: initT.priceTierLabel2, price: "" },
          { label: initT.priceTierLabel3, price: "" },
        ],
        cancellation: initT.defaultCancellation,
      };

      if (!editId) {
        const fullDraft = localStorage.getItem(DRAFT_KEY);
        if (fullDraft) {
          try {
            return { ...DEFAULT_FORM, ...langDefaults, ...JSON.parse(fullDraft) };
          } catch {}
        }
        const saved = localStorage.getItem("packageData");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            return {
              ...DEFAULT_FORM,
              ...langDefaults,
              destination: parsed.destination || "",
              price: parsed.price || "",
              description: parsed.description || "",
              includes: parsed.advantages?.length ? parsed.advantages : [],
              airports: parsed.airports?.length ? parsed.airports : DEFAULT_FORM.airports,
            };
          } catch {}
        }
        return { ...DEFAULT_FORM, ...langDefaults };
      }
    }
    return DEFAULT_FORM;
  });

  useEffect(() => {
    if (isEditMode || typeof window === "undefined") return;
    if (localStorage.getItem(DRAFT_KEY) || localStorage.getItem("packageData")) {
      setStep(1);
      setExtracted(true);
    }
  }, [isEditMode]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);

      const userRef = doc(db, "users", u.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, { plan: "free", packagesUsed: 0, aiLimit: FREE_AI_LIMIT, createdAt: Date.now() });
      }

      if (!editId) {
        const userData = userSnap.exists() ? userSnap.data() : {};
        const isPro = userData.plan === "pro" || userData.plan === "agency";
        if (!isPro) {
          const pkgSnap = await getDocs(query(collection(db, "packages"), where("userId", "==", u.uid)));
          if (pkgSnap.size >= FREE_PACKAGE_LIMIT) {
            router.push("/paywall");
            return;
          }
        }
        posthog.capture("builder_opened", { mode: "new" });
      } else {
        posthog.capture("builder_opened", { mode: "edit" });
      }

      if (editId) {
        const pkgSnap = await getDoc(doc(db, "packages", editId));
        if (pkgSnap.exists() && pkgSnap.data()?.userId === u.uid) {
          const d = pkgSnap.data();
          setForm({
            destination:  d.destination  || "",
            price:        d.price        || "",
            nights:       d.nights ? String(d.nights) : "5",
            title:        d.title        || "",
            description:  d.description  || "",
            includes:          Array.isArray(d.includes)     ? d.includes     : [],
            excludes:          Array.isArray(d.excludes)     ? d.excludes     : [],
            hotelDescription:  d.hotelDescription || "",
            airports:          Array.isArray(d.airports)     ? d.airports     : DEFAULT_FORM.airports,
            itinerary:    Array.isArray(d.itinerary)    ? d.itinerary    : DEFAULT_FORM.itinerary,
            pricingTiers: Array.isArray(d.pricingTiers) ? d.pricingTiers : DEFAULT_FORM.pricingTiers,
            cancellation: d.cancellation || "",
            whatsapp:     d.whatsapp     || "",
            messenger:    d.messenger    || "",
            coverImage:   d.coverImage   || "",
            images:       Array.isArray(d.images) ? d.images : [],
            videoUrl:     d.videoUrl     || "",
            language:     d.language === "ar" ? "ar" : "en",
          });
          setPackageId(editId);
          if (d.agencySlug) setAgencySlug(d.agencySlug);
        } else {
          router.push("/dashboard");
          return;
        }
      }

      setAuthLoading(false);
    });
    return () => unsub();
  }, [router, editId]);

  const update = (key: keyof Form, val: any) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (isEditMode || authLoading) return;
    setDraftStatus("saving");
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setDraftStatus("saved");
    }, 1500);
    return () => clearTimeout(timer);
  }, [form, isEditMode, authLoading]);

  // Swap default tier labels and cancellation text when the landing-page language changes
  useEffect(() => {
    const enT = T["en"];
    const arT = T["ar"];
    const EN_LABELS = [enT.priceTierLabel0, enT.priceTierLabel1, enT.priceTierLabel2, enT.priceTierLabel3];
    const AR_LABELS = [arT.priceTierLabel0, arT.priceTierLabel1, arT.priceTierLabel2, arT.priceTierLabel3];
    const fromLabels = form.language === "ar" ? EN_LABELS : AR_LABELS;
    const toLabels   = form.language === "ar" ? AR_LABELS : EN_LABELS;
    const fromCancel = form.language === "ar" ? enT.defaultCancellation : arT.defaultCancellation;
    const toCancel   = form.language === "ar" ? arT.defaultCancellation : enT.defaultCancellation;

    setForm(f => {
      const tiersAreDefault = f.pricingTiers.every((tier, i) => tier.label === fromLabels[i]);
      return {
        ...f,
        pricingTiers: tiersAreDefault
          ? f.pricingTiers.map((tier, i) => ({ ...tier, label: toLabels[i] }))
          : f.pricingTiers,
        cancellation: f.cancellation === fromCancel ? toCancel : f.cancellation,
      };
    });
  }, [form.language]);

  const handleSubmit = async () => {
    if (!form.destination || !form.price) {
      setError(t.destPriceRequired);
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      if (isEditMode && editId) {
        const res = await fetch("/api/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: editId, userId: user.uid }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Something went wrong."); return; }
        posthog.capture("package_updated", { destination: form.destination, price: form.price, language: form.language });
      } else {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, userId: user.uid }),
        });
        const json = await res.json();
        if (!res.ok || !json.id) { setError(json.error || "Something went wrong."); return; }
        await updateDoc(doc(db, "users", user.uid), { packagesUsed: increment(1) });
        setPackageId(json.id);
        if (json.agencySlug) setAgencySlug(json.agencySlug);
        localStorage.removeItem("packageData");
        localStorage.removeItem(DRAFT_KEY);
        posthog.capture("package_published", { destination: form.destination, price: form.price, language: form.language, nights: form.nights });
      }
      setDone(true);
    } catch (err: any) {
      posthog.captureException(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const finalPackageId = packageId || editId;
  const shareUrl = finalPackageId && agencySlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${agencySlug}/${finalPackageId}`
    : "";

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

  if (done && finalPackageId) {
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
            <h2 style={{ fontFamily: "var(--font-dm-serif), serif", fontSize: 32, marginBottom: 10 }}>
              {isEditMode ? t.changesSaved : t.landingPageCreated}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, maxWidth: 400 }}>
              {isEditMode ? t.changesSavedSub : t.landingPageCreatedSub}
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
              {copied ? t.copiedBtn : t.copyBtn}
            </button>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => router.push(`/${agencySlug}/${finalPackageId}`)} style={{
              background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              color: "#0d1b2e", border: "none", borderRadius: 10,
              padding: "11px 24px", fontSize: 14, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon name="eye" size={16} color="#0d1b2e" /> {t.previewLandingPage}
            </button>
            <button onClick={() => router.push("/dashboard")} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              color: "rgba(255,255,255,0.7)", borderRadius: 10,
              padding: "11px 24px", fontSize: 14, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
            }}>
              {t.goToDashboard}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "20px 16px" : "40px 48px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {isEditMode ? t.editPackageTitle : t.packageBuilderTitle}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              {isEditMode ? t.editPackageSub : t.packageBuilderSub}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!isEditMode && draftStatus !== "idle" && (
              <div style={{
                fontSize: 12, color: draftStatus === "saved" ? "rgba(45,212,160,0.7)" : "rgba(255,255,255,0.35)",
                display: "flex", alignItems: "center", gap: 5, transition: "color 0.3s",
              }}>
                {draftStatus === "saving"
                  ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderTopColor: "rgba(255,255,255,0.35)" }} /> Saving draft…</>
                  : <><Icon name="check" size={11} color="rgba(45,212,160,0.7)" strokeWidth={2.5} /> Draft saved</>
                }
              </div>
            )}
            {!isEditMode && extracted && (
              <div style={{
                background: `${SAND}18`, border: `1px solid ${SAND}35`,
                borderRadius: 99, padding: "5px 14px", fontSize: 12, color: SAND,
                display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
              }}>
                <Icon name="sparkle" size={12} color={SAND} />
                {t.aiExtractedBadge}
              </div>
            )}
          </div>
        </div>

        {/* Step pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", flexWrap: isMobile ? "nowrap" : "wrap", paddingBottom: isMobile ? 4 : 0 }}>
          {STEPS.map((s, i) => {
            if (isEditMode && i === 0) return null;
            return (
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
            );
          })}
        </div>

        {/* Step content + mini preview */}
        <div style={{ display: "flex", gap: 32 }}>
          <div className="fade-in" key={step} style={{ flex: 1, maxWidth: isMobile ? "100%" : 560 }}>
            {step === 0 && (
              <StepPaste
                t={t}
                lang={lang}
                onExtracted={data => {
                  setForm(f => ({
                    ...f,
                    ...(data.destination ? { destination: data.destination } : {}),
                    ...(data.price       ? { price:       data.price       } : {}),
                    ...(data.title       ? { title:       data.title       } : {}),
                    ...(data.description ? { description: data.description } : {}),
                    ...(data.includes?.length  ? { includes: data.includes  } : {}),
                    ...(data.airports?.length  ? { airports: data.airports  } : {}),
                  }));
                  setExtracted(true);
                }}
                onNext={() => setStep(1)}
              />
            )}
            {step === 1 && <Step0 form={form} update={update} t={t} />}
            {step === 2 && <Step1 form={form} update={update} t={t} />}
            {step === 3 && <Step2 form={form} update={update} t={t} lang={lang} />}
            {step === 4 && <Step3 form={form} update={update} t={t} />}
            {step === 5 && <Step4 form={form} update={update} t={t} />}
            {step === 6 && <StepCover form={form} update={update} user={user} t={t} />}
            {step === 7 && <Step5 form={form} update={update} user={user} t={t} lang={lang} />}
            {step === 8 && <Step6 form={form} update={update} user={user} t={t} />}
          </div>
          {!isMobile && (
            <div style={{ width: 260, flexShrink: 0 }}>
              <MiniPreview form={form} t={t} lang={lang} />
            </div>
          )}
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
          <button
            onClick={() => setStep(s => Math.max(isEditMode ? 1 : 0, s - 1))}
            disabled={step === (isEditMode ? 1 : 0)}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "10px 20px", color: "rgba(255,255,255,0.5)",
              fontSize: 13, fontFamily: "inherit",
              cursor: step === (isEditMode ? 1 : 0) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              opacity: step === (isEditMode ? 1 : 0) ? 0.3 : 1,
            }}>
            <Icon name="arrow_left" size={14} /> {t.backBtn}
          </button>

          {isEditMode ? (
            <button onClick={handleSubmit} disabled={generating} style={{
              background: generating ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              color: generating ? "rgba(255,255,255,0.4)" : "#0d1b2e",
              border: "none", borderRadius: 10,
              padding: "10px 28px", fontSize: 13, fontWeight: 700,
              fontFamily: "inherit", cursor: generating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {generating
                ? <><span className="spinner" style={{ borderTopColor: SAND }} /> {t.savingBtn}</>
                : <><Icon name="check" size={14} color="#0d1b2e" strokeWidth={2.5} /> {t.saveChangesBtn}</>
              }
            </button>
          ) : step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} style={{
              background: step === 0
                ? "rgba(255,255,255,0.06)"
                : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              color: step === 0 ? "rgba(255,255,255,0.5)" : "#0d1b2e",
              border: step === 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
              borderRadius: 10,
              padding: "10px 24px", fontSize: 13, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {step === 0 ? t.skipBtn : t.continueBtn} <Icon name="arrow_right" size={14} color={step === 0 ? "rgba(255,255,255,0.5)" : "#0d1b2e"} strokeWidth={2.5} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={generating} style={{
              background: generating ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              color: generating ? "rgba(255,255,255,0.4)" : "#0d1b2e",
              border: "none", borderRadius: 10,
              padding: "10px 28px", fontSize: 13, fontWeight: 700,
              fontFamily: "inherit", cursor: generating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {generating
                ? <><span className="spinner" style={{ borderTopColor: SAND }} /> {t.generatingBtn}</>
                : <><Icon name="sparkle" size={14} color="#0d1b2e" strokeWidth={2.5} /> {t.generateLandingPage}</>
              }
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={null}>
      <BuilderPageInner />
    </Suspense>
  );
}
