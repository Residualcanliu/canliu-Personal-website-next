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
    // 全部查询并行
    const [
      dailyRows,
      hourlyRows,
      articleRows,
      totalRows,
      todayRows,
      topPages,
    ] = await Promise.all([
      db
        .select({ day: sql`DATE(${visitLogs.createdAt})`, cnt: count() })
        .from(visitLogs)
        .where(gte(visitLogs.createdAt, sql`CURRENT_DATE - INTERVAL '29 days'`))
        .groupBy(sql`DATE(${visitLogs.createdAt})`)
        .orderBy(sql`DATE(${visitLogs.createdAt})`),
      db
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
        ),
      db.select({ n: count() }).from(articles),
      db.select({ n: count() }).from(visitLogs),
      db
        .select({ n: count() })
        .from(visitLogs)
        .where(gte(visitLogs.createdAt, sql`CURRENT_DATE`)),
      db
        .select({ path: visitLogs.path, cnt: count() })
        .from(visitLogs)
        .where(gte(visitLogs.createdAt, sql`CURRENT_DATE - INTERVAL '6 days'`))
        .groupBy(visitLogs.path)
        .orderBy(desc(count()))
        .limit(10),
    ]);

    return NextResponse.json({
      summary: {
        totalVisits: totalRows[0]?.n ?? 0,
        todayVisits: todayRows[0]?.n ?? 0,
        articleCount: articleRows[0]?.n ?? 0,
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

// DELETE /api/admin/analytics —— 清空访问记录
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await db.delete(visitLogs);
  return NextResponse.json({ ok: true });
}
