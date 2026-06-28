import { auth } from "@/auth";
import { db } from "@/db/index";
import { visitLogs, articles } from "@/db/schema";
import { sql, count } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/admin/analytics — 访问统计数据
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 最近 30 天每日访问量
  const dailyRows = await db.execute(sql`
    SELECT
      DATE(created_at) AS day,
      COUNT(*)::int AS cnt
    FROM "visitLog"
    WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
    GROUP BY day
    ORDER BY day
  `);

  // 最近 7 天每小时热力图数据
  const hourlyRows = await db.execute(sql`
    SELECT
      EXTRACT(DOW FROM created_at)::int AS dow,
      EXTRACT(HOUR FROM created_at)::int AS hour,
      COUNT(*)::int AS cnt
    FROM "visitLog"
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY dow, hour
    ORDER BY dow, hour
  `);

  // 文章总数
  const [articleRow] = await db.select({ n: count() }).from(articles);
  const [totalRow] = await db.select({ n: count() }).from(visitLogs);
  const [todayRow] = await db
    .select({ n: count() })
    .from(visitLogs)
    .where(sql`created_at >= CURRENT_DATE`);

  // 最近页面 Top 10
  const topPages = await db.execute(sql`
    SELECT path, COUNT(*)::int AS cnt
    FROM "visitLog"
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY path
    ORDER BY cnt DESC
    LIMIT 10
  `);

  return NextResponse.json({
    summary: {
      totalVisits: totalRow?.n ?? 0,
      todayVisits: todayRow?.n ?? 0,
      articleCount: articleRow?.n ?? 0,
    },
    daily: dailyRows.rows || dailyRows || [],
    hourly: hourlyRows.rows || hourlyRows || [],
    topPages: topPages.rows || topPages || [],
  });
}
