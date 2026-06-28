import { auth } from "@/auth";
import { db } from "@/db/index";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth-check";

// PUT /api/admin/settings — 更新设置
export async function PUT(req) {
  const session = await auth();
  if (!(await checkAdmin(session?.user?.id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const key = body.key || "status";
  const value = String(body.value || "");

  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });

  return NextResponse.json({ ok: true, key, value });
}
