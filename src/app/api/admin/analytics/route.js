import { auth } from "@/auth";
import { db } from "@/db/index";
import { visitLogs, articles } from "@/db/schema";
import { sql, count, gte, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // 最近 30 天每日访问量
    const dailyRows = await db
      .select({
        day: sql`DATE(${visitLogs.createdAt})`,
        cnt: count(),
      })
      .from(visitLogs)
      .where(gte(visitLogs.createdAt, sql`CURRENT_DATE - INTERVAL '29 days'`))
      .groupBy(sql`DATE(${visitLogs.createdAt})`)
      .orderBy(sql`DATE(${visitLogs.createdAt})`);

    // 最近 7 天每小时热力图
    const hourlyRows = await db
      .select({
        dow: sql`EXTRACT(DOW FROM ${visitLogs.createdAt})::int`,
        hour: sql`EXTRACT(HOUR FROM ${visitLogs.createdAt})::int`,
        cnt: count(),
      })
      .from(visitLogs)
      .where(gte(visitLogs.createdAt, sql`CURRENT_DATE - INTERVAL '6 days'`))
      .groupBy(
        sql`EXTRACT(DOW FROM ${visitLogs.createdAt})`,
        sql`EXTRACT(HOUR FROM ${visitLogs.createdAt})`
      )
      .orderBy(
        sql`EXTRACT(DOW FROM ${visitLogs.createdAt})`,
        sql`EXTRACT(HOUR FROM ${visitLogs.createdAt})`
      );

    // 文章总数 / 总访问 / 今日访问
    const [articleRow] = await db.select({ n: count() }).from(articles);
    const [totalRow] = await db.select({ n: count() }).from(visitLogs);
    const [todayRow] = await db
      .select({ n: count() })
      .from(visitLogs)
      .where(gte(visitLogs.createdAt, sql`CURRENT_DATE`));

    // Top 页面
    const topPages = await db
      .select({
        path: visitLogs.path,
        cnt: count(),
      })
      .from(visitLogs)
      .where(gte(visitLogs.createdAt, sql`CURRENT_DATE - INTERVAL '6 days'`))
      .groupBy(visitLogs.path)
      .orderBy(desc(sql`cnt`))
      .limit(10);

    return NextResponse.json({
      summary: {
        totalVisits: totalRow?.n ?? 0,
        todayVisits: todayRow?.n ?? 0,
        articleCount: articleRow?.n ?? 0,
      },
      daily: dailyRows,
      hourly: hourlyRows,
      topPages: topPages,
    });
  } catch (e) {
    console.error("analytics error", e);
    return NextResponse.json(
      { error: "数据查询失败，请稍后重试", detail: String(e) },
      { status: 500 }
    );
  }
}
