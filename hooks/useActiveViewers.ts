"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function makeSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// A session must heartbeat every HEARTBEAT_MS to stay alive.
// ACTIVE_WINDOW_MS must be comfortably larger so a late heartbeat doesn't
// cause the current viewer to flicker out.
const HEARTBEAT_MS   = 15_000; // 15 s
const ACTIVE_WINDOW_MS = 45_000; // 45 s — orphaned tabs expire quickly

export function useActiveViewers(packageId: string | undefined): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!packageId) return;

    const sessionId = makeSessionId();
    const sessionRef = doc(db, "presence", packageId, "viewers", sessionId);
    const colRef = collection(db, "presence", packageId, "viewers");

    // Write initial presence, then prune stale docs left by crashed sessions
    setDoc(sessionRef, { ts: serverTimestamp() })
      .then(() => getDocs(colRef))
      .then((snap) => {
        const cutoff = Date.now() - ACTIVE_WINDOW_MS;
        snap.docs.forEach((d) => {
          if (d.id === sessionId) return;
          const ts = d.data().ts as Timestamp | null;
          if (!ts || ts.toMillis() < cutoff) {
            deleteDoc(d.ref).catch(() => {});
          }
        });
      })
      .catch(() => {});

    // Heartbeat — keep the session alive
    const heartbeat = setInterval(() => {
      setDoc(sessionRef, { ts: serverTimestamp() }).catch(() => {});
    }, HEARTBEAT_MS);

    // Real-time count of viewers whose heartbeat is within the active window
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
