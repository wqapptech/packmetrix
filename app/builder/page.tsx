"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  coverImage: string;
  images: string[];
  videoUrl: string;
};

const DEFAULT_FORM: Form = {
  destination: "",
  price: "",
  nights: "5",
  description: "",
  includes: [],
  excludes: [],
  airports: [{ name: "", price: "" }],
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
};

const STEPS = ["Paste", "Basics", "Details", "Itinerary", "Pricing", "Contact", "Cover", "Media", "Video"];

const IMG_STYLES = [
  { id: "vibrant",   label: "Vibrant",   color: "#ff6b6b", bg: "linear-gradient(135deg, #ff6b6b, #feca57)",  desc: "Bold, colourful scenes" },
  { id: "minimal",   label: "Minimal",   color: "#a8a8a8", bg: "linear-gradient(135deg, #2d3436, #636e72)",  desc: "Clean, editorial look" },
  { id: "luxury",    label: "Luxury",    color: SAND,      bg: "linear-gradient(135deg, #8b6914, #e8c97b)",  desc: "Rich warm tones" },
  { id: "adventure", label: "Adventure", color: "#4ecdc4", bg: "linear-gradient(135deg, #134e5e, #71b280)",  desc: "Raw & dramatic" },
];

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
      <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(232,201,123,0.06)", border: "1px solid rgba(232,201,123,0.2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(232,201,123,0.18)", color: SAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
        <div style={{ flex: 1, fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>
          <b style={{ color: "#fff" }}>One coaching tip:</b> Pages with action verbs in the headline convert 31% better. Try{" "}
          <em style={{ color: SAND }}>"Watch the Aegean turn gold for five days."</em>
        </div>
      </div>
    </div>
  );
}

function TagInput({ value, onAdd }: { value: string[]; onAdd: (v: string[]) => void }) {
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
        placeholder="Type and press Enter…"
        style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", color: "var(--white)", fontSize: 12, fontFamily: "inherit", outline: "none" }}
        onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
      />
      <button onClick={commit} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>Add</button>
    </div>
  );
}

function Step1({ form, update }: { form: Form; update: (k: keyof Form, v: any) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Inclusions & Airports</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>What's included and departure options</p>

      <FieldLabel>Included</FieldLabel>
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
      <TagInput value={form.includes} onAdd={v => update("includes", v)} />

      <FieldLabel>Not Included</FieldLabel>
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
      <TagInput value={form.excludes} onAdd={v => update("excludes", v)} />

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
    </div>
  );
}

const COVER_W = 1920;
const COVER_H = 1080;
const COVER_RATIO = COVER_W / COVER_H; // 16:9

function StepCover({ form, update, user }: { form: Form; update: (k: keyof Form, v: any) => void; user: any }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(null);

    // Validate dimensions
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
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Cover Image</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
        This is the full-width hero image at the top of your landing page.
      </p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${SAND}15`, border: `1px solid ${SAND}30`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: SAND, fontWeight: 600, marginBottom: 20 }}>
        <Icon name="image" size={11} color={SAND} /> 16:9 ratio · minimum 1200×675px · JPG or PNG
      </div>

      {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 12 }}>{error}</p>}

      {form.coverImage ? (
        <div>
          <div style={{ position: "relative", width: "100%", aspectRatio: `${COVER_RATIO}`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            <img src={form.coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Icon name="check" size={14} color={SUCCESS} strokeWidth={2.5} />
            <span style={{ fontSize: 13, color: SUCCESS, fontWeight: 600 }}>Cover image set</span>
            <label style={{ marginLeft: "auto", fontSize: 12, color: SAND, cursor: "pointer", fontFamily: "inherit" }}>
              Replace
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} />
            </label>
            <button onClick={() => update("coverImage", "")} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label style={{
          display: "block", cursor: uploading ? "not-allowed" : "pointer",
          border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 14,
          overflow: "hidden", transition: "border-color 0.2s",
        }}
          onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = `${SAND}50`)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
        >
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} disabled={uploading} />
          {/* 16:9 aspect ratio container */}
          <div style={{ position: "relative", width: "100%", paddingTop: `${(1 / COVER_RATIO) * 100}%`, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {uploading ? (
                <><span className="spinner" style={{ borderTopColor: SAND }} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Uploading…</span></>
              ) : (
                <>
                  <Icon name="image" size={32} color="rgba(255,255,255,0.15)" />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>Click to upload cover image</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>16:9 · min 1200×675px · JPG or PNG</div>
                </>
              )}
            </div>
          </div>
        </label>
      )}
    </div>
  );
}

function Step5({ form, update, user }: { form: Form; update: (k: keyof Form, v: any) => void; user: any }) {
  const [mode, setMode] = useState<"upload" | "generate">("upload");
  const [imgStyle, setImgStyle] = useState("vibrant");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genLabel, setGenLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!form.destination) { setError("Enter a destination first."); return; }
    setError(null);
    setGenerating(true);
    setGenProgress(0);

    const steps = ["Analysing destination…", "Composing scenes…", "Adding lighting…", "Finalising images…"];
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(p + 4, 88);
      setGenProgress(p);
      setGenLabel(steps[Math.min(3, Math.floor(p / 25))]);
    }, 400);

    try {
      const res = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: form.destination, style: imgStyle }),
      });
      const json = await res.json();
      clearInterval(iv);
      if (!res.ok) throw new Error(json.error || "Generation failed");
      setGenProgress(100);
      setTimeout(() => {
        update("images", json.urls || []);
        setGenerating(false);
      }, 400);
    } catch (err: any) {
      clearInterval(iv);
      setGenerating(false);
      setError(err.message || "Generation failed. Please try again.");
    }
  };

  const removeImage = (i: number) => update("images", form.images.filter((_, j) => j !== i));

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Media</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Upload photos or generate them with AI</p>

      <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "4px 5px", marginBottom: 24, gap: 4 }}>
        {(["upload", "generate"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "6px 16px", borderRadius: 99, border: "none",
            background: mode === m ? "rgba(255,255,255,0.12)" : "transparent",
            color: mode === m ? "#fff" : "rgba(255,255,255,0.4)",
            fontSize: 12, fontWeight: mode === m ? 600 : 400,
            fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            {m === "upload"
              ? <><Icon name="image" size={12} color={mode === "upload" ? "white" : "rgba(255,255,255,0.4)"} /> Upload</>
              : <><Icon name="sparkle" size={12} color={mode === "generate" ? SAND : "rgba(255,255,255,0.4)"} /> Generate with AI</>
            }
          </button>
        ))}
      </div>

      {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 12 }}>{error}</p>}

      {form.images.length > 0 && mode === "upload" && (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(45,212,160,0.06)", border: "1px solid rgba(45,212,160,0.2)", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>
          💡 Packages with 5+ photos book <b style={{ color: SUCCESS }}>2.1× more often</b>. You have {form.images.length}.
        </div>
      )}

      {mode === "upload" ? (
        <div>
          <label style={{ display: "block", border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 14, padding: "32px 24px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = `${SAND}50`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
          >
            <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
            {uploading ? (
              <><span className="spinner" style={{ borderTopColor: SAND }} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>Uploading…</span></>
            ) : (
              <>
                <Icon name="image" size={28} color="rgba(255,255,255,0.2)" />
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginTop: 10 }}>Click to upload images</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>JPG, PNG · multiple files supported</div>
              </>
            )}
          </label>
          {form.images.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
              {form.images.map((url, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", boxShadow: i === 0 ? `0 0 0 2px ${SAND}80` : "none" }}>
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {i === 0 && (
                    <div style={{ position: "absolute", top: 7, left: 7, background: `${SAND}ee`, color: "#0a1426", borderRadius: 5, padding: "2px 7px", fontSize: 9, fontWeight: 800, letterSpacing: ".4px" }}>HERO</div>
                  )}
                  <button onClick={() => removeImage(i)} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : generating ? (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14, textAlign: "center" as const }}>{genLabel}</div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${genProgress}%`, background: `linear-gradient(90deg, ${SAND}, #c4a84f)`, borderRadius: 99, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center" as const }}>{genProgress}%</div>
        </div>
      ) : form.images.length > 0 ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            {form.images.map((url, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", boxShadow: i === 0 ? `0 0 0 2px ${SAND}80` : "none" }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {i === 0 && (
                  <div style={{ position: "absolute", top: 7, left: 7, background: `${SAND}ee`, color: "#0a1426", borderRadius: 5, padding: "2px 7px", fontSize: 9, fontWeight: 800, letterSpacing: ".4px" }}>HERO</div>
                )}
                <button onClick={() => removeImage(i)} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="check" size={14} color={SUCCESS} strokeWidth={2.5} />
            <span style={{ fontSize: 13, color: SUCCESS, fontWeight: 600 }}>{form.images.length} image{form.images.length !== 1 ? "s" : ""} ready</span>
            <button onClick={() => update("images", [])} style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Clear & regenerate</button>
          </div>
        </div>
      ) : (
        <div>
          <FieldLabel>Image Style</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
            {IMG_STYLES.map(s => (
              <button key={s.id} onClick={() => setImgStyle(s.id)} style={{
                background: imgStyle === s.id ? s.bg : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${imgStyle === s.id ? s.color : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12, padding: "16px 14px", cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: imgStyle === s.id ? "#fff" : "rgba(255,255,255,0.6)", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: imgStyle === s.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>{s.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={handleGenerate} style={{ width: "100%", padding: "12px", background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#0d1b2e", fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="sparkle" size={14} color="#0d1b2e" strokeWidth={2.5} /> Generate Images
          </button>
        </div>
      )}
    </div>
  );
}

function Step6({ form, update, user }: { form: Form; update: (k: keyof Form, v: any) => void; user: any }) {
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
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Video</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Upload a promo video for your package (optional)</p>

      {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 12 }}>{error}</p>}

      {form.videoUrl ? (
        <div>
          <video src={form.videoUrl} controls style={{ width: "100%", borderRadius: 12, background: "#0d1b2e", maxHeight: 280 }} />
          <button onClick={() => update("videoUrl", "")} style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Remove video
          </button>
        </div>
      ) : (
        <label style={{ display: "block", border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 14, padding: "40px 24px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = `${SAND}50`)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
        >
          <input type="file" accept="video/*" hidden onChange={handleFileChange} />
          {uploading ? (
            <><span className="spinner" style={{ borderTopColor: SAND }} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>Uploading…</span></>
          ) : (
            <>
              <Icon name="video" size={28} color="rgba(255,255,255,0.2)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginTop: 10 }}>Click to upload a video</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>MP4, MOV · max 100MB</div>
            </>
          )}
        </label>
      )}
    </div>
  );
}

function StepPaste({ onExtracted, onNext }: {
  onExtracted: (d: Partial<Form>) => void;
  onNext: () => void;
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
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Paste your travel post</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
        Drop in your Instagram caption, brochure copy, or a few notes. Our AI will pull out destination, price, advantages and itinerary.
      </p>
      <FieldLabel>Source post</FieldLabel>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={"🇬🇷 SANTORINI — 5 NIGHTS · €1,499 pp\n\nBoutique cave suite in Oia · Private caldera cruise · Sunset dinner…\n\n✈️ Departures: Athens, Thessaloniki\n💬 Book on WhatsApp"}
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
            ? `${text.length} chars · ~${Math.ceil(text.length / 240)}s to extract`
            : "Paste any format — Instagram, brochure, WhatsApp"}
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
            ? <><span className="spinner" style={{ borderTopColor: SAND }} /> Extracting…</>
            : <><Icon name="sparkle" size={14} color="#0d1b2e" /> Extract with AI</>
          }
        </button>
      </div>
    </div>
  );
}

function MiniPreview({ form }: { form: Form }) {
  const heroUrl = form.coverImage || form.images[0];
  const score = Math.min(100,
    (form.destination ? 15 : 0) +
    (form.price ? 10 : 0) +
    (form.description ? 15 : 0) +
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: ".7px", textTransform: "uppercase" as const }}>Live preview</span>
        <div style={{ display: "inline-flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 99, padding: 2 }}>
          <button style={{ padding: "3px 9px", border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 10, cursor: "pointer", borderRadius: 99, fontFamily: "inherit" }}>📱</button>
          <button style={{ padding: "3px 9px", border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer", borderRadius: 99, fontFamily: "inherit" }}>💻</button>
        </div>
      </div>

      {/* Phone frame */}
      <div style={{
        width: "100%", aspectRatio: "9/19", background: "#0a1426",
        borderRadius: 24, border: "6px solid #1a2438", overflow: "hidden",
        position: "relative" as const,
      }}>
        {/* Hero */}
        <div style={{
          height: "42%", position: "relative" as const,
          background: heroUrl
            ? `url(${heroUrl}) center/cover`
            : "linear-gradient(135deg, #1f5f8e, #0e3a5c)",
        }}>
          <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7))" }} />
          <div style={{ position: "absolute" as const, left: 12, right: 12, bottom: 10, color: "#fff" }}>
            <div style={{ fontSize: 8, opacity: 0.7, marginBottom: 3, letterSpacing: ".5px", textTransform: "uppercase" as const }}>
              {form.nights} nights · {form.price || "From —"}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, lineHeight: 1.1 }}>
              {form.destination || "Your Destination"}
            </div>
          </div>
        </div>

        {/* Body */}
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
            {form.whatsapp ? "Book on WhatsApp" : "Contact us"}
          </div>
          {form.pricingTiers.some(t => t.price) && (
            <div style={{ textAlign: "center" as const, fontSize: 6.5, color: "rgba(13,27,46,0.5)", marginTop: 5 }}>
              From {form.pricingTiers.find(t => t.price)?.price}
            </div>
          )}
        </div>
      </div>

      {/* Conversion score */}
      <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(232,201,123,0.07)", border: "1px solid rgba(232,201,123,0.2)", borderRadius: 9, fontSize: 10.5, color: "rgba(255,255,255,0.65)", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: SAND }}>✦</span>
        <span>
          <b style={{ color: scoreColor }}>Score: {score}/100</b>
          {" · "}{score >= 80 ? "Looking strong" : score >= 50 ? "Keep filling in" : "Add more details"}
        </span>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function BuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step, setStep] = useState(isEditMode ? 1 : 0);
  const [extracted, setExtracted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<Form>(() => {
    if (typeof window !== "undefined" && !editId) {
      const saved = localStorage.getItem("packageData");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_FORM,
            destination: parsed.destination || "",
            price: parsed.price || "",
            description: parsed.description || "",
            includes: parsed.advantages?.length ? parsed.advantages : [],
            airports: parsed.airports?.length ? parsed.airports : DEFAULT_FORM.airports,
          };
        } catch {}
      }
    }
    return DEFAULT_FORM;
  });

  // If user arrived from the home-page paste flow, skip the Paste step
  useEffect(() => {
    if (!isEditMode && typeof window !== "undefined" && localStorage.getItem("packageData")) {
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
        await setDoc(userRef, { plan: "free", packagesUsed: 0, aiLimit: 10, createdAt: Date.now() });
      }

      if (editId) {
        const pkgSnap = await getDoc(doc(db, "packages", editId));
        if (pkgSnap.exists() && pkgSnap.data()?.userId === u.uid) {
          const d = pkgSnap.data();
          setForm({
            destination:  d.destination  || "",
            price:        d.price        || "",
            nights:       d.nights ? String(d.nights) : "5",
            description:  d.description  || "",
            includes:     Array.isArray(d.includes)     ? d.includes     : [],
            excludes:     Array.isArray(d.excludes)     ? d.excludes     : [],
            airports:     Array.isArray(d.airports)     ? d.airports     : DEFAULT_FORM.airports,
            itinerary:    Array.isArray(d.itinerary)    ? d.itinerary    : DEFAULT_FORM.itinerary,
            pricingTiers: Array.isArray(d.pricingTiers) ? d.pricingTiers : DEFAULT_FORM.pricingTiers,
            cancellation: d.cancellation || "",
            whatsapp:     d.whatsapp     || "",
            messenger:    d.messenger    || "",
            coverImage:   d.coverImage   || "",
            images:       Array.isArray(d.images) ? d.images : [],
            videoUrl:     d.videoUrl     || "",
          });
          setPackageId(editId);
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

  const handleSubmit = async () => {
    if (!form.destination || !form.price) {
      setError("Destination and price are required.");
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
        localStorage.removeItem("packageData");
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const finalPackageId = packageId || editId;
  const shareUrl = finalPackageId ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${finalPackageId}` : "";

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
              {isEditMode ? "Changes saved!" : "Landing page created!"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, maxWidth: 400 }}>
              {isEditMode
                ? "Your landing page has been updated and is live."
                : "Your package page is live. Share the link and start tracking leads."}
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
            <button onClick={() => router.push(`/p/${finalPackageId}`)} style={{
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
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {isEditMode ? "Edit Package" : "Package Builder"}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              {isEditMode ? "Update your package details and save changes" : "Complete all steps to generate your landing page"}
            </p>
          </div>
          {!isEditMode && extracted && (
            <div style={{
              background: `${SAND}18`, border: `1px solid ${SAND}35`,
              borderRadius: 99, padding: "5px 14px", fontSize: 12, color: SAND,
              display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
            }}>
              <Icon name="sparkle" size={12} color={SAND} />
              AI extracted fields · review below
            </div>
          )}
        </div>

        {/* Step pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
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
          <div className="fade-in" key={step} style={{ flex: 1, maxWidth: 560 }}>
            {step === 0 && (
              <StepPaste
                onExtracted={data => {
                  setForm(f => ({
                    ...f,
                    ...(data.destination ? { destination: data.destination } : {}),
                    ...(data.price       ? { price:       data.price       } : {}),
                    ...(data.description ? { description: data.description } : {}),
                    ...(data.includes?.length  ? { includes: data.includes  } : {}),
                    ...(data.airports?.length  ? { airports: data.airports  } : {}),
                  }));
                  setExtracted(true);
                }}
                onNext={() => setStep(1)}
              />
            )}
            {step === 1 && <Step0 form={form} update={update} />}
            {step === 2 && <Step1 form={form} update={update} />}
            {step === 3 && <Step2 form={form} update={update} />}
            {step === 4 && <Step3 form={form} update={update} />}
            {step === 5 && <Step4 form={form} update={update} />}
            {step === 6 && <StepCover form={form} update={update} user={user} />}
            {step === 7 && <Step5 form={form} update={update} user={user} />}
            {step === 8 && <Step6 form={form} update={update} user={user} />}
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
            <Icon name="arrow_left" size={14} /> Back
          </button>

          {step < STEPS.length - 1 ? (
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
              {step === 0 ? "Skip" : "Continue"} <Icon name="arrow_right" size={14} color={step === 0 ? "rgba(255,255,255,0.5)" : "#0d1b2e"} strokeWidth={2.5} />
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
                ? <><span className="spinner" style={{ borderTopColor: SAND }} /> {isEditMode ? "Saving…" : "Generating…"}</>
                : isEditMode
                  ? <><Icon name="check" size={14} color="#0d1b2e" strokeWidth={2.5} /> Save Changes</>
                  : <><Icon name="sparkle" size={14} color="#0d1b2e" strokeWidth={2.5} /> Generate Landing Page</>
              }
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
