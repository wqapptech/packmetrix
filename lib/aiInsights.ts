import OpenAI from "openai";
import { randomUUID } from "crypto";
import { getPostHogClient } from "@/lib/posthog-server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Package = {
  destination: string;
  price: string;

  views: number;
  whatsappClicks: number;
  messengerClicks: number;
};

// -----------------------------
// MAIN AI INSIGHTS ENGINE
// -----------------------------
export async function generateInsights(pkg: Package, distinctId = "anonymous") {
  const clicks = pkg.whatsappClicks + pkg.messengerClicks;

  const ctr =
    pkg.views > 0 ? (clicks / pkg.views) * 100 : 0;

  const prompt = `
You are a senior growth analyst for a travel agency SaaS.

Analyze this package performance and give actionable insights:

--- DATA ---
Destination: ${pkg.destination}
Price: ${pkg.price}
Views: ${pkg.views}
Clicks: ${clicks}
CTR: ${ctr.toFixed(2)}%

--- TASK ---
Return ONLY a short insight (max 5–7 lines) that includes:

1. What is working or not working
2. Why users are not converting (if CTR is low)
3. One clear improvement suggestion
4. One marketing optimization idea

Be practical, direct, and business-focused.

Do NOT include introductions or fluff.
Do NOT use markdown.
`;

  const traceId = randomUUID();
  const startTime = Date.now();

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a performance marketing analyst for SaaS travel platforms.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    });

    const latency = (Date.now() - startTime) / 1000;
    const text = res.choices[0]?.message?.content;

    if (!text) {
      throw new Error("Empty AI response");
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId,
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_span_name: "ai_insights",
        $ai_model: res.model,
        $ai_provider: "openai",
        $ai_input_tokens: res.usage?.prompt_tokens,
        $ai_output_tokens: res.usage?.completion_tokens,
        $ai_latency: latency,
        $ai_stop_reason: res.choices[0]?.finish_reason,
      },
    });
    await posthog.shutdown();

    return text.trim();
  } catch (err) {
    console.error("AI Insights Error:", err);
    throw new Error("Failed to generate insights");
  }
}