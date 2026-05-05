import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const STYLE_PROMPTS: Record<string, string> = {
  vibrant: "vibrant, colorful, high-contrast travel photography",
  minimal: "minimal, clean, editorial travel photography, muted tones",
  luxury: "luxury travel photography, warm golden tones, premium aesthetic",
  adventure: "adventure travel photography, dramatic landscapes, raw energy",
};

export async function POST(req: Request) {
  try {
    const { destination, style = "vibrant" } = await req.json();

    if (!destination) {
      return NextResponse.json({ error: "Missing destination" }, { status: 400 });
    }

    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.vibrant;

    const prompts = [
      `${stylePrompt} of ${destination}, wide establishing shot, travel brochure quality, photorealistic`,
      `${stylePrompt} of ${destination}, local culture and street atmosphere, immersive scene, photorealistic`,
      `${stylePrompt} of ${destination}, iconic landmark or scenic viewpoint, professional travel photo, photorealistic`,
    ];

    const urls: string[] = [];
    for (const prompt of prompts) {
      const resp = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      const url = resp.data?.[0]?.url;
      if (url) {
        urls.push(url);
      }
    }

    return NextResponse.json({ urls });
  } catch (err: any) {
    console.error("generate-images error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate images" }, { status: 500 });
  }
}
