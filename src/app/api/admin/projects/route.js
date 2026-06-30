import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAdmin } from "@/lib/auth-check";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/admin/projects — 全部项目（含草稿）
export async function GET() {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await db.select().from(projects).orderBy(desc(projects.updatedAt));
  return NextResponse.json(rows);
}

// POST /api/admin/projects — 新建项目
export async function POST(req) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const id = crypto.randomUUID();
    const row = await db.insert(projects).values({
      id,
      title: body.title || "",
      content: body.content || "",
      tags: body.tags || "",
      link: body.link || "",
      published: body.published ? 1 : 0,
    }).returning();
    return NextResponse.json(row[0], { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
