import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { articles, visitLogs } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  // 统计数据
  const [articleCount] = await db
    .select({ n: count() })
    .from(articles);
  const [totalVisits] = await db
    .select({ n: count() })
    .from(visitLogs);
  const [todayVisits] = await db
    .select({ n: count() })
    .from(visitLogs)
    .where(
      sql`${visitLogs.createdAt} >= CURRENT_DATE`
    );

  const stats = [
    { label: "文章总数", value: articleCount?.n ?? 0, hint: "已发布 + 草稿", href: "/admin/articles" },
    { label: "今日访问", value: todayVisits?.n ?? 0, hint: "自今日 00:00", href: "/admin/analytics" },
    { label: "总访问量", value: totalVisits?.n ?? 0, hint: "累计 PV", href: "/admin/analytics" },
    { label: "项目点赞", value: "—", hint: "项目模块开发中", href: "/admin/projects" },
  ];

  return (
    <div style={{ padding: "36px 32px", maxWidth: 960 }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 500, marginBottom: 6 }}>
        欢迎，{session.user.name}
      </h2>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginBottom: 32 }}>
        管理后台概览
      </p>

      {/* 数据卡片 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        {stats.map((s) => {
          const card = (
            <div
              style={{
                padding: "20px 18px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 600,
                  marginTop: 6,
                  color: "#fff",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.2)",
                  marginTop: 4,
                }}
              >
                {s.hint}
              </div>
            </div>
          );
          return s.href ? (
            <a key={s.label} href={s.href} style={{ textDecoration: "none", color: "inherit" }}>
              {card}
            </a>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
