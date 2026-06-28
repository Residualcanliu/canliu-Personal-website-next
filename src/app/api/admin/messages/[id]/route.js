import { auth } from "@/auth";
import { db } from "@/db/index";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth-check";

// PUT /api/admin/messages/[id] — 审核（通过/拒绝）
export async function PUT(req, { params }) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json(); // { approved: 1 | -1 }
  await db
    .update(messages)
    .set({ approved: body.approved ?? 1 })
    .where(eq(messages.id, id));
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/messages/[id] — 删除留言
export async function DELETE(_req, { params }) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(messages).where(eq(messages.id, id));
  return NextResponse.json({ ok: true });
}
