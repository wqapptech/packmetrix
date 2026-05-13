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
    return NextResponse.json({ videos: [], total_results: 0 });
  }

  const [pexelsRes, pixabayRes] = await Promise.allSettled([
    fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=8&page=${page}`,
      { headers: { Authorization: PEXELS_KEY }, next: { revalidate: 300 } }
    ),
    fetch(
      `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&per_page=8&page=${page}&safesearch=true`,
      { next: { revalidate: 300 } }
    ),
  ]);

  const pexelsVideos: any[] = [];
  if (pexelsRes.status === "fulfilled" && pexelsRes.value.ok) {
    const data = await pexelsRes.value.json();
    pexelsVideos.push(...(data.videos || []));
  }

  const pixabayVideos: any[] = [];
  if (pixabayRes.status === "fulfilled" && pixabayRes.value.ok) {
    const data = await pixabayRes.value.json();
    for (const hit of data.hits || []) {
      const videoFiles: any[] = [];
      if (hit.videos?.large?.url) {
        videoFiles.push({ quality: "hd", file_type: "video/mp4", link: hit.videos.large.url });
      }
      if (hit.videos?.medium?.url) {
        videoFiles.push({ quality: "hd", file_type: "video/mp4", link: hit.videos.medium.url });
      }
      if (hit.videos?.small?.url) {
        videoFiles.push({ quality: "sd", file_type: "video/mp4", link: hit.videos.small.url });
      }
      pixabayVideos.push({
        id: `pb_${hit.id}`,
        image: `https://i.vimeocdn.com/video/${hit.picture_id}_640x360.jpg`,
        duration: hit.duration,
        video_files: videoFiles,
      });
    }
  }

  const videos = interleave(pexelsVideos, pixabayVideos);
  return NextResponse.json({ videos, total_results: videos.length });
}
