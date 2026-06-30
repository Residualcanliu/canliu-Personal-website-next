import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAdmin } from "@/lib/auth-check";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { eq } from "drizzle-orm";

// PUT — 更新歌曲
export async function PUT(req, { params }) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const form = await req.formData();
  const title = form.get("title")?.toString();
  const artist = form.get("artist")?.toString();
  const published = form.get("published") === "1" ? 1 : 0;

  const data = {};
  if (title !== undefined) data.title = title;
  if (artist !== undefined) data.artist = artist;
  if (published !== undefined) data.published = published;

  const row = await db.update(songs).set(data).where(eq(songs.id, id)).returning();
  if (!row.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row[0]);
}

// DELETE — 删除歌曲
export async function DELETE(_req, { params }) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(songs).where(eq(songs.id, id));
  return NextResponse.json({ ok: true });
}
