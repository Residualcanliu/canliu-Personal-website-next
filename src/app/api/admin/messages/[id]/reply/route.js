import { auth } from "@/auth";
import { db } from "@/db/index";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth-check";

// POST /api/admin/messages/[id]/reply — 管理员回复留言
export async function POST(req, { params }) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const replyContent = String(body.replyContent || "").trim().slice(0, 500);
  if (!replyContent) {
    return NextResponse.json({ error: "回复内容不能为空" }, { status: 400 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim().slice(0, 64) || "unknown";

  await db
    .update(messages)
    .set({ reply: replyContent, replyIp: ip, replyAt: new Date() })
    .where(eq(messages.id, id));

  return NextResponse.json({ ok: true, reply: replyContent });
}

// DELETE /api/admin/messages/[id]/reply — 管理员删除回复
export async function DELETE(_req, { params }) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  await db
    .update(messages)
    .set({ reply: null, replyIp: null, replyAt: null })
    .where(eq(messages.id, id));

  return NextResponse.json({ ok: true });
}
