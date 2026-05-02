import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  increment,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { id, sessionId } = await req.json();

    if (!id || !sessionId) {
      return NextResponse.json(
        { error: "Missing id or sessionId" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 1. DEDUP CHECK (SESSION)
    // -----------------------------
    const sessionRef = doc(
      db,
      "packageSessions",
      `${id}_${sessionId}`
    );

    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      // already counted this session → ignore
      return NextResponse.json({ skipped: true });
    }

    // -----------------------------
    // 2. MARK SESSION AS COUNTED
    // -----------------------------
    await setDoc(sessionRef, {
      packageId: id,
      sessionId,
      createdAt: Date.now(),
    });

    // -----------------------------
    // 3. INCREMENT VIEW
    // -----------------------------
    await updateDoc(doc(db, "packages", id), {
      views: increment(1),
      lastViewedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      counted: true,
    });
  } catch (err) {
    console.error("track-view error:", err);

    return NextResponse.json(
      { error: "tracking failed" },
      { status: 500 }
    );
  }
}