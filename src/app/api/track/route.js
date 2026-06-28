import { db } from "@/db/index";
import { visitLogs } from "@/db/schema";
import { NextResponse } from "next/server";

// POST /api/track — 记录页面访问
export async function POST(req) {
  try {
    const body = await req.json();
    const path = (body.path || "/").slice(0, 256);
    // 过滤后台和 API 路径
    if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/dev")) return NextResponse.json({ ok: true, skipped: true });
    await db.insert(visitLogs).values({
      id: crypto.randomUUID(),
      path,
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
