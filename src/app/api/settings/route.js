import { db } from "@/db/index";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/settings?key=status — 公开读取
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key") || "status";
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return NextResponse.json({ value: row?.value || "" });
}
