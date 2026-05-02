import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

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
  "description": string,
  "advantages": string[],
  "airports": { name: string, price: string }[]
}

If something is missing, use empty string or empty array.
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

    const data = await response.json();

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