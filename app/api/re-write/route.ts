export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = `
You are a high-conversion travel marketing expert.

Rewrite this travel package to maximize bookings and WhatsApp clicks.

Return JSON ONLY in this format:

{
  "destination": "...",
  "title": "...",
  "description": "...",
  "advantages": ["...", "...", "..."],
  "cta": "..."
}

PACKAGE:
Destination: ${body.destination}
Price: ${body.price}
Description: ${body.description || ""}
Advantages: ${(body.advantages || []).join(", ")}
`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You output ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const content = res.choices[0]?.message?.content || "{}";

    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "rewrite failed" },
      { status: 500 }
    );
  }
}