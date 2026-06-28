import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/index";
import * as schema from "@/db/schema";

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
    signIn({ account, profile }) {
      if (account?.provider === "github") {
        const username = profile?.login;
        if (!username || !adminUsers.includes(username.toLowerCase())) {
          return "/admin/login?error=unauthorized";
        }
      }
      return true;
    },
    session({ session, user }) {
      if (user) {
        session.user.isAdmin = adminUsers.includes(
          (session.user.name || "").toLowerCase()
        );
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
});
