"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function makeSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// TTL for considering a viewer "active" (2 minutes)
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

export function useActiveViewers(packageId: string | undefined): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!packageId) return;

    const sessionId = makeSessionId();
    const sessionRef = doc(db, "presence", packageId, "viewers", sessionId);
    const colRef = collection(db, "presence", packageId, "viewers");

    // Write initial presence
    setDoc(sessionRef, { ts: serverTimestamp() }).catch(() => {});

    // Heartbeat every 30s to stay "active"
    const heartbeat = setInterval(() => {
      setDoc(sessionRef, { ts: serverTimestamp() }).catch(() => {});
    }, 30_000);

    // Listen and count viewers active within the window
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const cutoff = Date.now() - ACTIVE_WINDOW_MS;
        const active = snap.docs.filter((d) => {
          const ts = d.data().ts as Timestamp | null;
          return ts && ts.toMillis() > cutoff;
        }).length;
        setCount(active);
      },
      () => setCount(null),
    );

    return () => {
      clearInterval(heartbeat);
      deleteDoc(sessionRef).catch(() => {});
      unsub();
    };
  }, [packageId]);

  return count;
}
