import { auth } from "@/auth";
import { db } from "@/db/index";
import { comments } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkAdmin, checkOrigin } from "@/lib/auth-check";

// GET /api/admin/comments — 列出全部评论
export async function GET(request) {
  const csrfErr = checkOrigin(request);
  if (csrfErr) return csrfErr;

  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(comments)
    .orderBy(desc(comments.createdAt));
  return NextResponse.json(rows);
}
