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
You extract structured travel package data from agency posts or brochures.

Return ONLY valid JSON matching this schema exactly:
{
  "destination": string,
  "price": string,
  "currency": string,
  "nights": string,
  "title": string,
  "description": string,
  "language": "en" | "ar",
  "suggestedPreset": "umrah" | "city_break" | "cruise" | "day_tour" | "safari" | "",
  "advantages": string[],
  "excludes": string[],
  "airports": { "name": string, "arrivingAirport": string, "price": string, "date": string, "flyingTime": string, "arrivingTime": string }[],
  "itinerary": { "day": number, "title": string, "desc": string }[],
  "pricingTiers": { "label": string, "price": string }[],
  "hotelDescription": string
}

Rules:
- "title": a short, punchy headline (5–12 words). Use action words and destination name. Empty string if unsure.
- "description": body copy describing the package (not the headline).
- "language": "ar" if the source text is predominantly Arabic, otherwise "en".
- "suggestedPreset": pick the single best-fit category:
    "umrah"      → Umrah, Hajj, or religious pilgrimage packages
    "city_break" → City trips, cultural or sightseeing tours
    "cruise"     → Cruise itineraries or sea voyages
    "day_tour"   → Day trips, excursions, short tours under 2 days
    "safari"     → Safari, wildlife, nature, or adventure packages
    Leave empty string "" if none clearly fits.
- "currency": ISO-4217 code inferred from the price string. Map Arabic/symbol cues: ريال/ر.س/﷼ → "SAR", درهم/د.إ → "AED", جنيه/ج.م → "EGP", دينار كويتي/د.ك → "KWD", دينار بحريني → "BHD", ريال عماني/ر.ع → "OMR", دينار أردني → "JOD", ليرة/TL → "TRY", € → "EUR", $ → "USD", £ → "GBP". Leave "" if unclear.
- "advantages": what is INCLUDED in the package (bullet points).
- "excludes": what is explicitly NOT included.
- "airports": one entry per departure city. Fill only the fields present; leave others as "".
- "itinerary": extract or infer day-by-day programme if present. Use sequential day numbers starting at 1.
- "pricingTiers": any per-person price tiers found (label + price pairs).
- "hotelDescription": any hotel, accommodation, or star-rating details mentioned.
- If a field is missing, use "" or [].
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