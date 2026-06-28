import { db } from "@/db/index";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/articles/[slug] — 公开单篇（按 slug）
export async function GET(_req, { params }) {
  const { slug } = await params;
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!rows[0].published) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
