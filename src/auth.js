import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/index";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

const adminUsers = (process.env.ADMIN_GITHUB_USERS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 天
    updateAge: 24 * 60 * 60,   // 每 24h 续期一次
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "github") {
        const username = profile?.login;
        if (!username || !adminUsers.includes(username.toLowerCase())) {
          return "/admin/login?error=unauthorized";
        }
        // 确保数据库里 githubUsername 不为空（修复已有用户 & 新用户）
        if (user?.id) {
          try {
            await db
              .update(schema.users)
              .set({ githubUsername: username })
              .where(eq(schema.users.id, user.id));
          } catch { /* 忽略 */ }
        }
      }
      return true;
    },
    session({ session, user }) {
      if (user) {
        const name = (user.name || "").toLowerCase();
        const gh = (user.githubUsername || "").toLowerCase();
        session.user.isAdmin =
          adminUsers.includes(name) || adminUsers.includes(gh);
      }
      return session;
    },
  },
  events: {
    // 新用户首次登录：写入 githubUsername
    async linkAccount({ user, account, profile }) {
      if (account?.provider === "github" && profile?.login && user?.id) {
        try {
          await db
            .update(schema.users)
            .set({ githubUsername: profile.login })
            .where(eq(schema.users.id, user.id));
        } catch { /* 忽略 */ }
      }
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
});
