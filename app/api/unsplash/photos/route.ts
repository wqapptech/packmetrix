export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  const page  = req.nextUrl.searchParams.get("page")  || "1";

  if (!query.trim()) {
    return NextResponse.json({ photos: [], total_results: 0 });
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&page=${page}&orientation=landscape`,
    {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ photos: [], total_results: 0 });
  }

  const data = await res.json();

  const photos = (data.results || []).map((photo: any) => ({
    id: photo.id,
    alt: photo.description || photo.alt_description || "",
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    photoUrl: photo.links.html,
    downloadLocation: photo.links.download_location,
    src: {
      thumb: photo.urls.thumb,
      small: photo.urls.small,
      regular: photo.urls.regular,
    },
  }));

  return NextResponse.json({ photos, total_results: data.total || photos.length });
}
