import { db } from "@/db/index";
import { visitLogs } from "@/db/schema";
import { NextResponse } from "next/server";

// POST /api/track — 记录页面访问
export async function POST(req) {
  try {
    const body = await req.json();
    await db.insert(visitLogs).values({
      id: crypto.randomUUID(),
      path: (body.path || "/").slice(0, 256),
      ip: (req.headers.get("x-forwarded-for") || "").slice(0, 64),
      ua: (req.headers.get("user-agent") || "").slice(0, 512),
      referer: (req.headers.get("referer") || "").slice(0, 512),
      createdAt: new Date(),
    });
  } catch {
    // 静默失败，不影响页面
  }
  return NextResponse.json({ ok: true });
}
