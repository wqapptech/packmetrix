export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!;

// Unsplash API terms require triggering the download endpoint whenever a
// photo is used in a user's content (hotlink + download tracking).
export async function POST(req: NextRequest) {
  const { downloadLocation } = await req.json();

  if (!downloadLocation || typeof downloadLocation !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // downloadLocation is the full URL from photo.links.download_location
  const url = downloadLocation.includes("?")
    ? `${downloadLocation}&client_id=${ACCESS_KEY}`
    : `${downloadLocation}?client_id=${ACCESS_KEY}`;

  await fetch(url, { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } });

  return NextResponse.json({ ok: true });
}
