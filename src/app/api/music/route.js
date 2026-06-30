import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET — 已发布歌曲
export async function GET() {
  const rows = await db.select({
    id: songs.id, title: songs.title, artist: songs.artist,
    url: songs.url, cover: songs.cover, createdAt: songs.createdAt,
  }).from(songs).where(eq(songs.published, 1)).orderBy(desc(songs.createdAt));
  return NextResponse.json(rows);
}
