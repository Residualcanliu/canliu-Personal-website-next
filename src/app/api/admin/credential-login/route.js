import { db } from "@/db/index";
import { users, accounts, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST /api/admin/credential-login — 账号密码登录
export async function POST(req) {
  try {
    const { username, password } = await req.json();

    // 凭据仅从环境变量读取（.env.local，已 gitignore，不会上传）
    const VALID_USERNAME = process.env.LOCAL_ADMIN_USER;
    const VALID_PASSWORD = process.env.LOCAL_ADMIN_PASS;
    if (!VALID_USERNAME || !VALID_PASSWORD) {
      return NextResponse.json({ error: "服务未配置" }, { status: 500 });
    }

    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    const mockUserId = "credential-admin";
    const now = new Date();
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 确保管理员用户存在
    const [existing] = await db.select().from(users).where(eq(users.id, mockUserId)).limit(1);
    if (!existing) {
      await db.insert(users).values({
        id: mockUserId,
        name: "Residualcanliu",
        email: "admin@localhost",
        isAdmin: 1,
        githubUsername: "Residualcanliu",
      });
      await db.insert(accounts).values({
        userId: mockUserId,
        type: "oauth",
        provider: "github",
        providerAccountId: "credential-account",
      });
    }

    // 创建 session
    await db.delete(sessions).where(eq(sessions.userId, mockUserId));
    await db.insert(sessions).values({ sessionToken, userId: mockUserId, expires });

    // 设置 cookie
    const ck = await cookies();
    ck.set("authjs.session-token", sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
