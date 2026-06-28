import { auth } from "@/auth";
import { db } from "@/db/index";
import { messages } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth-check";

// GET /api/admin/messages — 列出所有留言（含待审）
export async function GET() {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(messages)
    .orderBy(desc(messages.createdAt));
  return NextResponse.json(rows);
}
