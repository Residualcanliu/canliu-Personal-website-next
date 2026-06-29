import { db } from "@/db/index";
import { visitLogs, articles, settings } from "@/db/schema";
import { sql, count, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { validateBotApiKey } from "@/lib/bot-auth";

export async function GET(request) {
  const authErr = validateBotApiKey(request);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const [todayRows, totalRows, articleRows, statusRow] = await Promise.all([
      db
        .select({ n: count() })
        .from(visitLogs)
        .where(gte(visitLogs.createdAt, sql`CURRENT_DATE`)),
      db.select({ n: count() }).from(visitLogs),
      db.select({ n: count() }).from(articles),
      db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, "status")),
    ]);

    const todayVisits = todayRows[0]?.n ?? 0;
    const totalVisits = totalRows[0]?.n ?? 0;
    const articleCount = articleRows[0]?.n ?? 0;
    const statusText = statusRow[0]?.value || "探索宇宙中";

    if (format === "text") {
      const text = [
        "canliuweb.cc.cd 状态报告",
        `今日访问: ${todayVisits} | 总访问: ${totalVisits.toLocaleString()} | 文章: ${articleCount} 篇`,
        `状态: ${statusText}`,
      ].join("\n");
      return new NextResponse(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({
      summary: { todayVisits, totalVisits, articleCount },
      status: { text: statusText },
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("bot status error", e);
    return NextResponse.json(
      { error: "查询失败", detail: String(e) },
      { status: 500 }
    );
  }
}
