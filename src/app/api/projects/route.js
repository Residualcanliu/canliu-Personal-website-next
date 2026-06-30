import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/projects — 已发布的项目
export async function GET() {
  const rows = await db.select({
    id: projects.id,
    title: projects.title,
    content: projects.content,
    tags: projects.tags,
    link: projects.link,
    createdAt: projects.createdAt,
    updatedAt: projects.updatedAt,
  }).from(projects).where(eq(projects.published, 1)).orderBy(desc(projects.updatedAt));
  return NextResponse.json(rows);
}
