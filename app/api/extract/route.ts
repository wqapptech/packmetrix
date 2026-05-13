export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(req: Request) {
  try {
    const { text, userId } = await req.json();

    const traceId = randomUUID();
    const startTime = Date.now();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" }, // 🔥 IMPORTANT FIX
        messages: [
          {
            role: "system",
            content: `
You extract structured travel packages from messy posts.

Return ONLY valid JSON in this format:
{
  "destination": string,
  "price": string,
  "title": string,
  "description": string,
  "advantages": string[],
  "airports": { name: string, price: string }[]
}

Rules:
- "title": a short, punchy headline for the package (5–12 words). Use action words and destination name. Example: "Discover Magical Santorini — 5 Nights of Luxury". Leave empty string if you cannot write a good one.
- "description": the body copy describing the package (exclude the headline sentence).
- If something is missing, use empty string or empty array.
Do NOT include markdown. Do NOT wrap in code blocks.
            `,
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    const latency = (Date.now() - startTime) / 1000;
    const data = await response.json();

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userId || "anonymous",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_span_name: "package_extract",
        $ai_model: data?.model || "gpt-4o-mini",
        $ai_provider: "openai",
        $ai_input_tokens: data?.usage?.prompt_tokens,
        $ai_output_tokens: data?.usage?.completion_tokens,
        $ai_latency: latency,
        $ai_http_status: response.status,
        $ai_stop_reason: data?.choices?.[0]?.finish_reason,
      },
    });
    await posthog.shutdown();

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No content returned from AI" },
        { status: 500 }
      );
    }

    // Since response_format=json_object → this is already safe JSON
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Server error",
        details: err.message,
      },
      { status: 500 }
    );
  }
}