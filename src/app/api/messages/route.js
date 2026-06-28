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

// POST /api/messages — 提交留言（待审核）
export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 30);
    const content = String(body.content || "").trim().slice(0, 500);
    const msgStatus = String(body.msgStatus || "").trim().slice(0, 60);
    if (!name || !content) {
      return NextResponse.json({ error: "请填写昵称和留言内容" }, { status: 400 });
    }
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      name,
      content,
      msgStatus,
      approved: 0,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
