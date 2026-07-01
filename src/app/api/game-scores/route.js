import { NextResponse } from "next/server";
import { db } from "@/db";
import { gameScores } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

// GET — 排行榜
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "abyss";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const rows = await db.select().from(gameScores)
      .where(eq(gameScores.mode, mode))
      .orderBy(desc(gameScores.score))
      .limit(limit);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — 提交分数
export async function POST(req) {
  try {
    const body = await req.json();
    const { mode, score, playerName, config } = body;
    if (!mode || score == null) {
      return NextResponse.json({ error: "mode 和 score 必填" }, { status: 400 });
    }
    const name = (playerName || "匿名").trim().substring(0, 20) || "匿名";
    const id = crypto.randomUUID();
    await db.insert(gameScores).values({
      id, mode, score: Math.round(score),
      playerName: name,
      config: config ? JSON.stringify(config) : null,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
