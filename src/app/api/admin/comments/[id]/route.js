import { auth } from "@/auth";
import { db } from "@/db/index";
import { comments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkAdmin, checkOrigin } from "@/lib/auth-check";

// PUT /api/admin/comments/[id] — 审核通过/拒绝
export async function PUT(request, { params }) {
  const csrfErr = checkOrigin(request);
  if (csrfErr) return csrfErr;

  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const approved = body.approved ?? 1;

  await db.update(comments).set({ approved }).where(eq(comments.id, id));
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/comments/[id] — 删除评论
export async function DELETE(request, { params }) {
  const csrfErr = checkOrigin(request);
  if (csrfErr) return csrfErr;

  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(comments).where(eq(comments.id, id));
  return NextResponse.json({ ok: true });
}
