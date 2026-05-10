export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { getPostHogClient } from "@/lib/posthog-server";

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

    const traceId = randomUUID();
    const startTime = Date.now();

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You output ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const latency = (Date.now() - startTime) / 1000;
    const content = res.choices[0]?.message?.content || "{}";

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: body.userId || "anonymous",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_span_name: "package_rewrite",
        $ai_model: res.model,
        $ai_provider: "openai",
        $ai_input_tokens: res.usage?.prompt_tokens,
        $ai_output_tokens: res.usage?.completion_tokens,
        $ai_latency: latency,
        $ai_stop_reason: res.choices[0]?.finish_reason,
      },
    });
    await posthog.shutdown();

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