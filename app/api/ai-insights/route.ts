import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin"; // IMPORTANT: use admin SDK in production
import { generateInsights } from "@/lib/aiInsights";

const PLAN_LIMITS = {
  free: 10,
  pro: 999999,
};

// -----------------------------
// STRIPE + AI USAGE CONTROLLED ROUTE
// -----------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      destination,
      price,
      views,
      whatsappClicks,
      messengerClicks,
    } = body;

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!userId || !destination) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // -----------------------------
    // GET USER FROM FIRESTORE
    // -----------------------------
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userSnap.data();

    const plan = user?.plan || "free";
    const usage = user?.aiUsage || 0;
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

    // -----------------------------
    // STRIPE LIMIT CHECK
    // -----------------------------
    if (usage >= limit) {
      return NextResponse.json(
        {
          error:
            "AI limit reached. Upgrade to Pro to continue.",
        },
        { status: 403 }
      );
    }

    // -----------------------------
    // CALL AI
    // -----------------------------
    const text = await generateInsights({
      destination,
      price,
      views,
      whatsappClicks,
      messengerClicks,
    });

    if (!text) {
      return NextResponse.json(
        { error: "AI failed" },
        { status: 500 }
      );
    }

    // -----------------------------
    // INCREMENT USAGE
    // -----------------------------
    await userRef.update({
      aiUsage: usage + 1,
      updatedAt: Date.now(),
    });

    // -----------------------------
    // RESPONSE
    // -----------------------------
    return NextResponse.json({
      text,
      usage: usage + 1,
      limit,
    });
  } catch (err) {
    console.error("AI Route Error:", err);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}