"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      // 1. Create Firebase user
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCred.user;

      // 2. Create Firestore user (FREE PLAN INIT)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        plan: "free",
        aiUsage: 0,
        aiLimit: 10,

        stripeCustomerId: null,

        createdAt: Date.now(),
      });

      // 3. Redirect
      router.push("/builder");
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-96 space-y-4">

        <h1 className="text-2xl font-bold">Sign Up</h1>

        <input
          className="w-full p-3 border rounded-xl"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded-xl"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full bg-black text-white p-3 rounded-xl"
        >
          Create account
        </button>

      </div>
    </div>
  );
}