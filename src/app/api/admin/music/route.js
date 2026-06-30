import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAdmin } from "@/lib/auth-check";
import { db } from "@/db";
import { songs } from "@/db/schema";

export const maxDuration = 60; // 允许大文件上传
import { eq, desc } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET — 全部歌曲
export async function GET() {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await db.select().from(songs).orderBy(desc(songs.createdAt));
  return NextResponse.json(rows);
}

// POST — 新建歌曲（支持文件上传或 URL）
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
    const published = form.get("published") === "1" ? 1 : 0;
    let url = urlInput;

    // 文件上传
    const file = form.get("file");
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "mp3";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const dir = path.join(process.cwd(), "public", "music");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, filename), buffer);
      url = `/music/${filename}`;
    }

    if (!title || !url) {
      return NextResponse.json({ error: "标题和音频不能为空" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const row = await db.insert(songs).values({ id, title, artist, url, published }).returning();
    return NextResponse.json(row[0], { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
