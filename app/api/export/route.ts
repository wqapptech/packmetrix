export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import React from "react";
import { db } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { buildExportData } from "@/lib/export/data";
import { getExportFonts, buildFontList } from "@/lib/export/fonts";
import { ShareSquare, ShareVertical } from "@/lib/export/images";
import { PdfCover, PdfContent, PdfContact } from "@/lib/export/pdf";

type Format = "square" | "vertical" | "pdf";
type Lang   = "en" | "ar";

const DAYS_PER_PAGE = 7;
const MAX_DAYS      = 28; // 4 content pages × 7 days; beyond this the final page discloses

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Fetch remote image as base64 data URI so satori can embed it.
// Fails gracefully — returns null if the image is unreachable.
async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const buf  = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/jpeg";
    const b64  = Buffer.from(buf).toString("base64");
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url    = new URL(req.url);
  const pkgId  = url.searchParams.get("pkgId")  || "";
  const format = (url.searchParams.get("format") || "square") as Format;
  const lang   = (url.searchParams.get("lang")   || "en")     as Lang;

  if (!pkgId) {
    return NextResponse.json({ error: "Missing pkgId" }, { status: 400 });
  }
  if (!["square", "vertical", "pdf"].includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }
  if (!["en", "ar"].includes(lang)) {
    return NextResponse.json({ error: "Invalid lang" }, { status: 400 });
  }

  // ── Auth: verify Firebase ID token ────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const user = await verifyUser(authHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Fetch package + verify ownership ──────────────────────────────────────
  const pkgSnap = await db.collection("packages").doc(pkgId).get();
  if (!pkgSnap.exists) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
  const pkgData = pkgSnap.data() as Record<string, unknown>;
  if (pkgData.userId !== user.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Fetch user/agency doc ─────────────────────────────────────────────────
  const userSnap = await db.collection("users").doc(user.uid).get();
  const userData = (userSnap.data() || {}) as Record<string, unknown>;

  // ── Build export data ─────────────────────────────────────────────────────
  const data = buildExportData({ ...pkgData, id: pkgSnap.id }, userData, lang);

  // ── Cover image (real or null → component falls back to gradient) ─────────
  let coverDataUri: string | null = null;
  if (data.coverImageUrl) {
    coverDataUri = await fetchImageAsDataUri(data.coverImageUrl);
  }
  const exportData = coverDataUri
    ? { ...data, coverImageUrl: coverDataUri }
    : { ...data, coverImageUrl: undefined };

  // ── Real QR code ──────────────────────────────────────────────────────────
  // Encodes the live package URL — must actually scan to the live page.
  // PDF uses 168px to cover both the 68px cover QR and 112px contact QR.
  const qrSize = format === "pdf" || format === "vertical" ? 168 : 108;
  const qrDataUri = await QRCode.toDataURL(data.url, {
    width:        qrSize,
    margin:       1,
    color:        { dark: "#1a1611", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  // ── Load fonts ────────────────────────────────────────────────────────────
  const fonts   = await getExportFonts();
  const fontList = buildFontList(fonts, lang);

  const slug = data.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);

  // ── PDF ────────────────────────────────────────────────────────────────────
  if (format === "pdf") {
    const A4_W = 794;
    const A4_H = 1123;
    const isAr = lang === "ar";

    // Chunk itinerary — chunking is the ONLY thing that controls what shows.
    // Days beyond MAX_DAYS are disclosed, never silently dropped.
    const allDays    = exportData.itinerary;
    const daysToShow = allDays.slice(0, MAX_DAYS);
    const hiddenDays = allDays.length - daysToShow.length;

    const itinChunks = chunkArray(daysToShow, DAYS_PER_PAGE);
    if (itinChunks.length === 0) itinChunks.push([]); // always at least one content page

    const disclosureNote = hiddenDays > 0 ? {
      text: isAr
        ? `${hiddenDays} ${hiddenDays === 1 ? "يوم إضافي" : "أيام إضافية"} · البرنامج الكامل:`
        : `${hiddenDays} more day${hiddenDays > 1 ? "s" : ""} · full itinerary at:`,
      url: exportData.url,
    } : undefined;

    const total = 2 + itinChunks.length; // cover + N content pages + contact

    // Cover (page 1)
    const coverPng = new Uint8Array(await new ImageResponse(
      React.createElement(PdfCover, { data: exportData, lang, qrDataUri }),
      { width: A4_W, height: A4_H, fonts: fontList },
    ).arrayBuffer());

    // Content pages (pages 2 … total-1) — rendered sequentially (CPU-bound wasm)
    const contentPngs: Uint8Array[] = [];
    for (let ci = 0; ci < itinChunks.length; ci++) {
      const isLastChunk = ci === itinChunks.length - 1;
      contentPngs.push(new Uint8Array(await new ImageResponse(
        React.createElement(PdfContent, {
          data:            exportData,
          lang,
          pageNum:         2 + ci,
          total,
          itinerarySlice:  itinChunks[ci],
          showOverview:    ci === 0,
          disclosureNote:  isLastChunk ? disclosureNote : undefined,
        }),
        { width: A4_W, height: A4_H, fonts: fontList },
      ).arrayBuffer()));
    }

    // Contact (page total)
    const contactPng = new Uint8Array(await new ImageResponse(
      React.createElement(PdfContact, { data: exportData, lang, pageNum: total, total, qrDataUri }),
      { width: A4_W, height: A4_H, fonts: fontList },
    ).arrayBuffer());

    // Stitch all pages into A4 PDF
    const pdfDoc  = await PDFDocument.create();
    const A4_PT_W = 595.28;
    const A4_PT_H = 841.89;

    for (const pngBytes of [coverPng, ...contentPngs, contactPng]) {
      const img  = await pdfDoc.embedPng(pngBytes);
      const page = pdfDoc.addPage([A4_PT_W, A4_PT_H]);
      page.drawImage(img, { x: 0, y: 0, width: A4_PT_W, height: A4_PT_H });
    }

    const pdfBytes = await pdfDoc.save();
    const filename = `${slug}-brochure-${lang}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store",
      },
    });
  }

  // ── Images (square / vertical) ────────────────────────────────────────────
  const isVertical = format === "vertical";
  const width  = 1080;
  const height = isVertical ? 1920 : 1080;

  const element = isVertical
    ? React.createElement(ShareVertical, { data: exportData, lang, qrDataUri })
    : React.createElement(ShareSquare,   { data: exportData, lang, qrDataUri });

  const imgResponse = new ImageResponse(element, { width, height, fonts: fontList });
  // Materialize the PNG so any satori render error is caught by the route wrapper.
  const imgBuf = await imgResponse.arrayBuffer();

  const filename = `${slug}-${format}-${lang}.png`;

  return new Response(imgBuf, {
    status:  200,
    headers: {
      "Content-Type":        "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
