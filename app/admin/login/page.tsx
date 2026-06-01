"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

const NAVY  = "#1a1611";
const SAND  = "#b08a3e";
const ERROR = "#c0392b";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();

      // Verify admin status via the agencies API — 403 means not an admin
      const res = await fetch("/api/admin/agencies", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        await auth.signOut();
        setError("This account does not have admin access.");
        return;
      }

      router.replace("/admin");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px", color: NAVY }}>Admin Sign In</div>
          <div style={{ fontSize: 13, color: "#968d7c", marginTop: 6 }}>PackMetrix internal dashboard</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Admin email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={inputStyle}
          />

          {error && (
            <div style={{ fontSize: 12.5, color: ERROR, padding: "8px 12px", borderRadius: 8, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.2)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 4, padding: "11px", borderRadius: 10, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: NAVY, fontWeight: 700, fontSize: 13.5, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#ffffff",
  border: "1px solid rgba(26,22,17,0.15)",
  borderRadius: 10,
  padding: "11px 14px",
  color: "#1a1611",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
