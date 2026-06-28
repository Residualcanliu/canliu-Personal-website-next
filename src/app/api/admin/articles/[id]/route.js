import { auth } from "@/auth";
import { db } from "@/db/index";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/admin/articles/[id] — 获取单篇文章
export async function GET(_req, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

// PUT /api/admin/articles/[id] — 更新文章
export async function PUT(req, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const existing = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!existing.length) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db
    .update(articles)
    .set({
      title: body.title ?? existing[0].title,
      content: body.content ?? existing[0].content,
      excerpt: body.excerpt ?? existing[0].excerpt,
      coverImage: body.coverImage !== undefined ? body.coverImage : existing[0].coverImage,
      published: body.published !== undefined ? (body.published ? 1 : 0) : existing[0].published,
      slug:
        body.slug ||
        (body.title
          ? body.title
              .replace(/[^a-zA-Z0-9一-龥]+/g, "-")
              .replace(/^-|-$/g, "")
              .toLowerCase()
          : existing[0].slug),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id));

  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return NextResponse.json(rows[0]);
}

// DELETE /api/admin/articles/[id] — 删除文章
export async function DELETE(_req, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(articles).where(eq(articles.id, id));
  return NextResponse.json({ ok: true });
}
