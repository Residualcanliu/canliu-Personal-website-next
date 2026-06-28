import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const adminUsers = (process.env.ADMIN_GITHUB_USERS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
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
    jwt({ token, profile }) {
      if (profile) {
        const username = profile?.login || "";
        token.isAdmin = adminUsers.includes(username.toLowerCase());
        token.githubUsername = username;
      }
      return token;
    },
    session({ session, token }) {
      session.user.isAdmin = Boolean(token.isAdmin);
      session.user.githubUsername = token.githubUsername || null;
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
});
