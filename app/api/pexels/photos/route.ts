import { NextRequest, NextResponse } from "next/server";

const PEXELS_KEY = "DxWXtvmCjPBoFQkdBblsoccf4vy5BCAZx5oivI3s7ilAlB7vsoKCBpeB";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  const page  = req.nextUrl.searchParams.get("page")  || "1";

  if (!query.trim()) {
    return NextResponse.json({ photos: [], total_results: 0 });
  }

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=18&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY }, next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Pexels request failed" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
