import { NextResponse } from "next/server";

/**
 * 验证 Bot API Key，支持两种传入方式：
 * 1. Authorization: Bearer <key> header（推荐）
 * 2. ?key=<key> query parameter（备选，兼容无法设置 header 的工具）
 *
 * 返回 null 表示验证通过，返回 NextResponse(401) 表示失败。
 */
export function validateBotApiKey(request) {
  // header 优先
  const authHeader = request.headers.get("authorization") || "";
  let token = authHeader.replace(/^Bearer\s+/i, "").trim();

  // fallback: query param
  if (!token) {
    const { searchParams } = new URL(request.url);
    token = searchParams.get("key") || "";
  }

  const expected = process.env.API_KEY;
  if (!expected || !token || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return null;
}
