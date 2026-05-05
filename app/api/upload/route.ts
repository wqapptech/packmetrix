import { NextResponse } from "next/server";
import { bucket } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const uid = formData.get("uid") as string | null;

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const urls: string[] = [];

    const files = formData.getAll("file") as File[];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const token = uuidv4();
      const filename = `packages/${uid}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const fileRef = bucket.file(filename);

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: { firebaseStorageDownloadTokens: token },
        },
        resumable: false,
      });

      const encodedPath = encodeURIComponent(filename);
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
      urls.push(url);
    }

    return NextResponse.json({ urls });
  } catch (err: any) {
    console.error("upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
