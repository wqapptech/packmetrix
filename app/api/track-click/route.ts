import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { packageId, type } = await req.json();

    if (!packageId || !type) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const ref = doc(db, "packages", packageId);

    if (type === "view") {
      await updateDoc(ref, {
        views: increment(1),
      });
    }

    if (type === "whatsapp") {
      await updateDoc(ref, {
        whatsappClicks: increment(1),
      });
    }

    if (type === "messenger") {
      await updateDoc(ref, {
        messengerClicks: increment(1),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Track click error:", err);

    return NextResponse.json(
      { error: "Failed to track" },
      { status: 500 }
    );
  }
}