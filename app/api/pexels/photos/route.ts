export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const PEXELS_KEY = "DxWXtvmCjPBoFQkdBblsoccf4vy5BCAZx5oivI3s7ilAlB7vsoKCBpeB";
const PIXABAY_KEY = "55851792-94951ecdbde103e9452c25a2a";

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  const page  = req.nextUrl.searchParams.get("page")  || "1";

  if (!query.trim()) {
    return NextResponse.json({ photos: [], total_results: 0 });
  }

  const [pexelsRes, pixabayRes] = await Promise.allSettled([
    fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&page=${page}&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY }, next: { revalidate: 300 } }
    ),
    fetch(
      `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=12&page=${page}&safesearch=true`,
      { next: { revalidate: 300 } }
    ),
  ]);

  const pexelsPhotos: any[] = [];
  if (pexelsRes.status === "fulfilled" && pexelsRes.value.ok) {
    const data = await pexelsRes.value.json();
    pexelsPhotos.push(...(data.photos || []));
  }

  const pixabayPhotos: any[] = [];
  if (pixabayRes.status === "fulfilled" && pixabayRes.value.ok) {
    const data = await pixabayRes.value.json();
    for (const hit of data.hits || []) {
      pixabayPhotos.push({
        id: `pb_${hit.id}`,
        alt: hit.tags,
        photographer: hit.user,
        src: {
          medium: hit.webformatURL,
          large: hit.largeImageURL,
          large2x: hit.largeImageURL,
        },
      });
    }
  }

  const photos = interleave(pexelsPhotos, pixabayPhotos);
  return NextResponse.json({ photos, total_results: photos.length });
}
