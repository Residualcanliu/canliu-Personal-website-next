"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import StarCollector from "@/components/StarCollector";

function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [selMode, setSelMode] = useState("abyss");
  const loadedRef = useRef(false);

  const fetchScores = useCallback(async (m) => {
    try {
      const res = await fetch("/api/game-scores?mode=" + m + "&limit=15");
      const data = await res.json();
      setScores(Array.isArray(data) ? data : []);
    } catch { setScores([]); }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) { loadedRef.current = true; fetchScores("abyss"); }
  }, [fetchScores]);

  const modes = [
    { id: "abyss", label: "深渊" },
    { id: "timed", label: "计时" },
    { id: "lives", label: "生命" },
  ];

  const fmtCfg = (s) => {
    if (!s.config) return null;
    try {
      const c = typeof s.config === "string" ? JSON.parse(s.config) : s.config;
      const bv = { 80: "极小", 105: "较小", 130: "标准", 160: "较大", 190: "超大" };
      const fv = { 0.3: "极慢", 0.4: "慢", 0.5: "标准", 0.7: "快", 0.9: "很快", 1.2: "风暴", 1.5: "深渊风暴" };
      const mv = { 7: "龟速", 10: "慢", 14: "标准", 18: "快", 22: "极速" };
      const sv = { 0: "小", 1: "中", 2: "大" };
      const parts = [bv[c.basketW] || "?", fv[c.fallSpeed] || "?", mv[c.moveSpeed] || "?", sv[c.starSize] || "?"];
      // 算倍率
      const mulTables = {
        basketW:  { 80:0.35,105:0.15,130:0,160:-0.15,190:-0.25 },
        fallSpeed: { 0.3:-0.30,0.4:-0.15,0.5:0,0.7:0.15,0.9:0.30,1.2:0.50,1.5:0.65 },
        moveSpeed: { 7:0.30,10:0.15,14:0,18:-0.15,22:-0.25 },
        starSize:  { 0:0.30,1:0,2:-0.25 },
      };
      let mul = 1 + (mulTables.basketW[c.basketW]||0) + (mulTables.fallSpeed[c.fallSpeed]||0) + (mulTables.moveSpeed[c.moveSpeed]||0) + (mulTables.starSize[c.starSize]||0);
      mul = Math.round(mul * 100) / 100;
      return parts.join("/") + " x" + mul.toFixed(2);
    } catch { return null; }
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: 360, height: "100vh",
      background: "rgba(4,4,16,0.85)", borderLeft: "1px solid rgba(255,255,255,0.06)",
      zIndex: 10, color: "#fff", overflowY: "auto",
      fontFamily: "\"PingFang SC\",\"Microsoft YaHei UI\",sans-serif",
      padding: "20px 18px",
    }}>
      <div style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: 14, color: "rgba(255,255,255,0.75)" }}>
        排行榜
      </div>

      {/* 模式切换 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => { setSelMode(m.id); fetchScores(m.id); }} style={{
            flex: 1, padding: "7px 0", fontSize: "0.82rem", borderRadius: 6, cursor: "pointer",
            color: selMode === m.id ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
            background: selMode === m.id ? "rgba(100,160,255,0.15)" : "rgba(255,255,255,0.03)",
            border: selMode === m.id ? "1px solid rgba(100,160,255,0.25)" : "1px solid rgba(255,255,255,0.05)",
          }}>{m.label}</button>
        ))}
      </div>

      {scores.length === 0 ? (
        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.2)", textAlign: "center", padding: 20 }}>
          暂无记录
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {scores.map((row, i) => {
            const cfgStr = selMode === "abyss" ? fmtCfg(row) : null;
            return (
              <div key={row.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
                borderRadius: 6, fontSize: "0.85rem",
                background: i < 3 ? "rgba(255,255,255,0.03)" : "transparent",
              }}>
                <span style={{
                  width: 18, textAlign: "center", fontWeight: 600,
                  color: i === 0 ? "#ffb83c" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "rgba(255,255,255,0.2)",
                }}>{i + 1}</span>
                <span style={{ flex: 1, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.playerName || "匿名"}
                </span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{row.score}</span>
                {cfgStr && (
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.22)" }}>
                    {cfgStr}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SagittariusPage() {
  const router = useRouter();
  const [showLB, setShowLB] = useState(true);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#050510", position: "relative" }}>
      <StarCollector onBack={() => router.push("/")} onModeChange={(m, cfg) => setShowLB(m === null || cfg)} />
      {showLB && <Leaderboard />}
      {/* 返回按钮 */}
      <a
        onClick={() => router.push("/")}
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 20,
          color: "rgba(255,255,255,0.35)", fontSize: "0.82rem",
          cursor: "pointer", textDecoration: "none",
          padding: "6px 14px", borderRadius: 6,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          transition: "color 0.2s, background 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      >
        ← 返回主页
      </a>
    </div>
  );
}
