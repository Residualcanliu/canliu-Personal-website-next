import { db } from "@/db/index";
import { articles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/articles — 公开列表（仅已发布）
export async function GET() {
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      coverImage: articles.coverImage,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.published, 1))
    .orderBy(desc(articles.updatedAt));
  return NextResponse.json(rows);
}
