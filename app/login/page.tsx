"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const userCred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCred.user;

      // optional: wait for auth propagation
      await user.getIdToken();

      // redirect to app
      router.push("/builder");
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="w-96 space-y-4 bg-white p-6 rounded-2xl border">

        <h1 className="text-2xl font-bold">
          Welcome back
        </h1>

        <p className="text-sm text-gray-500">
          Login to access your dashboard
        </p>

        {/* EMAIL */}
        <input
          className="w-full p-3 border rounded-xl"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          className="w-full p-3 border rounded-xl"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* ERROR */}
        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded-xl"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* SIGNUP LINK */}
        <p className="text-sm text-center text-gray-500">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-black font-medium underline"
          >
            Sign up
          </a>
        </p>

      </div>

    </div>
  );
}