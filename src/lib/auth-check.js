import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
