import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { packageId, type } = await req.json();

    if (!packageId || !type) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const pkgRef = db.collection("packages").doc(packageId);

    if (type === "whatsapp" || type === "messenger") {
      const pkgSnap = await pkgRef.get();
      if (pkgSnap.exists) {
        const pkg = pkgSnap.data()!;
        await db.collection("leads").add({
          packageId,
          userId: pkg.userId,
          destination: pkg.destination || "",
          price: pkg.price || "",
          channel: type,
          status: "new",
          createdAt: Date.now(),
        });
        const field = type === "whatsapp" ? "whatsappClicks" : "messengerClicks";
        await pkgRef.update({ [field]: FieldValue.increment(1) });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Track click error:", err);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
