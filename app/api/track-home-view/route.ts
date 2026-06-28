export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Homepage visit tracking — mirrors /api/track-view but counts visits to an
// agency's public homepage. Resolves the agency by slug and increments
// homepageViews on the user doc, deduped per browser session.
export async function POST(req: Request) {
  try {
    const { slug, sessionId } = await req.json();

    if (!slug || !sessionId) {
      return NextResponse.json({ error: "Missing slug or sessionId" }, { status: 400 });
    }

    const sessionRef = db.collection("homepageSessions").doc(`${slug}_${sessionId}`);
    const sessionSnap = await sessionRef.get();
    if (sessionSnap.exists) {
      return NextResponse.json({ skipped: true });
    }

    const userSnap = await db
      .collection("users")
      .where("agencySlug", "==", slug)
      .limit(1)
      .get();
    if (userSnap.empty) {
      return NextResponse.json({ error: "agency not found" }, { status: 404 });
    }

    await sessionRef.set({ agencySlug: slug, sessionId, createdAt: Date.now() });
    await userSnap.docs[0].ref.update({ homepageViews: FieldValue.increment(1) });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("track-home-view error:", err);
    return NextResponse.json({ error: "tracking failed" }, { status: 500 });
  }
}
