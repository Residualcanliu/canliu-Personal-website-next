import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAdmin } from "@/lib/auth-check";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/projects/[id]
export async function GET(_req, { params }) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!row.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row[0]);
}

// PUT /api/admin/projects/[id]
export async function PUT(req, { params }) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const row = await db.update(projects).set({
    title: body.title ?? undefined,
    content: body.content ?? undefined,
    tags: body.tags ?? undefined,
    link: body.link ?? undefined,
    published: body.published !== undefined ? (body.published ? 1 : 0) : undefined,
    updatedAt: new Date(),
  }).where(eq(projects.id, id)).returning();
  if (!row.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row[0]);
}

// DELETE /api/admin/projects/[id]
export async function DELETE(_req, { params }) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(projects).where(eq(projects.id, id));
  return NextResponse.json({ ok: true });
}
