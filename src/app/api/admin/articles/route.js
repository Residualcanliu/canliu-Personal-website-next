import { auth } from "@/auth";
import { db } from "@/db/index";
import { articles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth-check";

// GET /api/admin/articles — 列出全部文章（含草稿）
export async function GET() {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(articles)
    .orderBy(desc(articles.updatedAt));
  return NextResponse.json(rows);
}

// POST /api/admin/articles — 创建新文章
export async function POST(req) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const id = crypto.randomUUID();
  const now = new Date();
  const slug =
    body.slug ||
    body.title
      .replace(/[^a-zA-Z0-9一-龥]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() ||
    id.slice(0, 8);

  try {
    await db.insert(articles).values({
      id,
      title: body.title || "无标题",
      slug,
      content: body.content || "",
      excerpt: body.excerpt || "",
      published: body.published ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
  } catch (e) {
    // slug 唯一约束冲突
    if (e.code === "23505" || String(e.message || "").includes("unique") || String(e.message || "").includes("duplicate")) {
      return NextResponse.json({ error: "该 Slug 已被使用，请换一个" }, { status: 409 });
    }
    throw e;
  }

  const row = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return NextResponse.json(row[0], { status: 201 });
}
