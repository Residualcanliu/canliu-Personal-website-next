import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// 直接从数据库查询用户是否为管理员
export async function checkAdmin(userId) {
  if (!userId) return false;
  try {
    const [row] = await db
      .select({ githubUsername: users.githubUsername })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!row?.githubUsername) return false;
    const list = (process.env.ADMIN_GITHUB_USERS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase());
    return list.includes(row.githubUsername.toLowerCase());
  } catch {
    return false;
  }
}

// 验证请求来源是否为本站（简易 CSRF 防护）
export function checkOrigin(request) {
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const host = request.headers.get("host") || "";
  const siteOrigin = `https://${host}`;

  // GET/HEAD 不检查
  if (request.method === "GET" || request.method === "HEAD") return null;

  // 检查 Origin 或 Referer 是否匹配
  const ok = !origin || origin === siteOrigin || origin.startsWith("http://localhost");
  const refOk = !referer || referer.startsWith(siteOrigin) || referer.startsWith("http://localhost");

  if (!ok || !refOk) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}
