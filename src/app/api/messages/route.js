import { db } from "@/db/index";
import { messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/messages — 获取已通过的留言
export async function GET() {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.approved, 1))
    .orderBy(desc(messages.createdAt))
    .limit(50);
  return NextResponse.json(rows);
}

// POST /api/messages — 提交留言（待审核，IP 频率限制 30s）
export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 30);
    const content = String(body.content || "").trim().slice(0, 500);
    const msgStatus = String(body.msgStatus || "").trim().slice(0, 60);
    if (!name || !content) {
      return NextResponse.json({ error: "请填写昵称和留言内容" }, { status: 400 });
    }

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim().slice(0, 64) || "unknown";

    // 同一 IP 30 秒内只能提交一次
    const recent = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.ip, ip))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    if (recent[0]) {
      const elapsed = Date.now() - new Date(recent[0].createdAt).getTime();
      if (elapsed < 30_000) {
        return NextResponse.json({ error: "提交太频繁，请稍后再试" }, { status: 429 });
      }
    }

    await db.insert(messages).values({
      id: crypto.randomUUID(),
      name,
      content,
      msgStatus,
      ip,
      approved: 0,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
