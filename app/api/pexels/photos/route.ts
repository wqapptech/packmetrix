export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const PEXELS_KEY = "DxWXtvmCjPBoFQkdBblsoccf4vy5BCAZx5oivI3s7ilAlB7vsoKCBpeB";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  const page  = req.nextUrl.searchParams.get("page")  || "1";

  if (!query.trim()) {
    return NextResponse.json({ photos: [], total_results: 0 });
  }

  const pexelsRes = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=24&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY }, next: { revalidate: 300 } }
  ).catch(() => null);

  const pexelsPhotos: any[] = [];
  if (pexelsRes?.ok) {
    const data = await pexelsRes.json();
    pexelsPhotos.push(...(data.photos || []));
  }

  return NextResponse.json({ photos: pexelsPhotos, total_results: pexelsPhotos.length });
}
