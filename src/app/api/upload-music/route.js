import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAdmin } from "@/lib/auth-check";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { put } from "@vercel/blob";

export async function POST(req) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const title = form.get("title")?.toString() || "";
    const artist = form.get("artist")?.toString() || "";
    const urlInput = form.get("url")?.toString() || "";
    let url = urlInput;

    const file = form.get("file");
    if (file && file.size > 0) {
      const ext = file.name.split(".").pop() || "mp3";
      const blob = await put(`music/${crypto.randomUUID()}.${ext}`, file, {
        access: "public",
        contentType: file.type || "audio/mpeg",
      });
      url = blob.url;
    }

    if (!title || !url) {
      return NextResponse.json({ error: "标题和音频不能为空" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await db.insert(songs).values({ id, title, artist, url, published: 1 });
    return NextResponse.json({ ok: true, url }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
