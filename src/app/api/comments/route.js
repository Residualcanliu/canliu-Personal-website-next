import { db } from "@/db/index";
import { comments, articles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/comments?articleSlug=xxx — 获取某篇文章已通过的评论
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const articleSlug = searchParams.get("articleSlug") || "";

  if (!articleSlug) {
    return NextResponse.json({ error: "缺少 articleSlug" }, { status: 400 });
  }

  // 找到文章 ID
  const article = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, articleSlug))
    .limit(1);

  if (!article[0]) {
    return NextResponse.json([]);
  }

  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.articleId, article[0].id))
    .where(eq(comments.approved, 1))
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return NextResponse.json(rows);
}

// POST /api/comments — 提交评论（待审核，IP 频率限制 30s）
export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 30);
    const content = String(body.content || "").trim().slice(0, 500);
    const articleSlug = String(body.articleSlug || "").trim();

    if (!name || !content || !articleSlug) {
      return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
    }

    // 找到文章
    const article = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, articleSlug))
      .limit(1);

    if (!article[0]) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim().slice(0, 64) || "unknown";

    // 同一 IP 30 秒内只能提交一次
    const recent = await db
      .select({ createdAt: comments.createdAt })
      .from(comments)
      .where(eq(comments.ip, ip))
      .orderBy(desc(comments.createdAt))
      .limit(1);
    if (recent[0]) {
      const elapsed = Date.now() - new Date(recent[0].createdAt).getTime();
      if (elapsed < 30_000) {
        return NextResponse.json({ error: "提交太频繁，请稍后再试" }, { status: 429 });
      }
    }

    await db.insert(comments).values({
      id: crypto.randomUUID(),
      articleId: article[0].id,
      name,
      content,
      ip,
      approved: 0,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
