"use client";

import { useState, useEffect } from "react";

const DOW_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "36px 32px", color: "rgba(255,255,255,0.35)" }}>
        加载中...
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div style={{ padding: "36px 32px", color: "rgba(255,120,120,0.8)" }}>
        {data?.error || "加载失败"} {data?.detail ? `— ${data.detail}` : ""}
      </div>
    );
  }

  const { summary, daily = [], hourly = [], topPages = [] } = data;

  // 准备折线图数据
  const maxDaily = Math.max(...daily.map((d) => d.cnt), 1);
  const dayLabels = daily.map((d) => {
    const parts = (d.day || "").split("-");
    return parts.length === 3 ? parts[1] + "/" + parts[2] : d.day;
  });
  const dayValues = daily.map((d) => d.cnt);

  // 准备热力图数据：7行(dow) x 24列(hour)
  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxHeat = 1;
  (hourly || []).forEach((h) => {
    const d = h.dow != null ? h.dow : -1;
    const hr = h.hour != null ? h.hour : -1;
    const c = h.cnt || 0;
    if (d >= 0 && d < 7 && hr >= 0 && hr < 24) {
      heatmap[d][hr] = c;
      if (c > maxHeat) maxHeat = c;
    }
  });

  return (
    <div style={{ padding: "36px 32px", maxWidth: 1000 }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 500, marginBottom: 6 }}>
        访问统计
      </h2>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginBottom: 28 }}>
        近 30 天趋势 / 近 7 天时段分布
      </p>

      {/* --- 概览卡片 --- */}
      <div
        style={{
          display: "flex",
          gap: 14,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "今日访问", value: summary.todayVisits },
          { label: "总访问量", value: summary.totalVisits },
          { label: "文章总数", value: summary.articleCount },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              flex: "1 1 140px",
              padding: "16px 20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
              {c.label}
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 600, marginTop: 4 }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* --- 折线图 --- */}
      <div
        style={{
          padding: "20px 24px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: 16, color: "rgba(255,255,255,0.6)" }}>
          每日访问量（近 30 天）
        </h3>
        {daily.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
            暂无数据
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
              height: 160,
              padding: "0 4px",
            }}
          >
            {dayValues.map((v, i) => {
              const h = Math.max((v / maxDaily) * 150, v > 0 ? 3 : 0);
              return (
                <div
                  key={i}
                  title={`${dayLabels[i]}: ${v} 次`}
                  style={{
                    flex: 1,
                    height: h,
                    minWidth: 6,
                    background:
                      v > 0
                        ? "rgba(100,160,255,0.55)"
                        : "rgba(255,255,255,0.05)",
                    borderRadius: "2px 2px 0 0",
                    transition: "height 0.3s",
                    cursor: "default",
                  }}
                />
              );
            })}
          </div>
        )}
        {/* X 轴标签（每 7 天标一个） */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.18)",
            padding: "0 4px",
          }}
        >
          {dayLabels.map((l, i) =>
            i % 7 === 0 || i === dayLabels.length - 1 ? (
              <span key={i}>{l}</span>
            ) : (
              <span key={i} />
            )
          )}
        </div>
      </div>

      {/* --- 热力图 --- */}
      <div
        style={{
          padding: "20px 24px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: 14, color: "rgba(255,255,255,0.6)" }}>
          时段热力图（近 7 天）
        </h3>
        <div style={{ display: "flex", gap: 4 }}>
          {/* 行标签 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              justifyContent: "center",
              marginRight: 6,
            }}
          >
            {DOW_LABELS.map((label, i) => (
              <div
                key={i}
                style={{
                  height: 18,
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.3)",
                  lineHeight: "18px",
                  textAlign: "right",
                  width: 16,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          {/* 热力格 */}
          <div style={{ flex: 1 }}>
            {/* 列标签 */}
            <div
              style={{
                display: "flex",
                gap: 1,
                marginBottom: 4,
              }}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  style={{
                    flex: 1,
                    fontSize: "0.55rem",
                    color: "rgba(255,255,255,0.18)",
                    textAlign: "center",
                  }}
                >
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {/* 格子 */}
            {heatmap.map((row, d) => (
              <div
                key={d}
                style={{ display: "flex", gap: 1, marginBottom: 1 }}
              >
                {row.map((val, h) => {
                  const alpha = maxHeat > 0 ? val / maxHeat : 0;
                  return (
                    <div
                      key={h}
                      title={`周${DOW_LABELS[d]} ${h}:00 - ${val} 次`}
                      style={{
                        flex: 1,
                        height: 16,
                        background: `rgba(100,160,255,${(alpha * 0.7).toFixed(2)})`,
                        borderRadius: 2,
                        cursor: "default",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Top 页面 --- */}
      <div
        style={{
          padding: "20px 24px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
        }}
      >
        <h3 style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: 12, color: "rgba(255,255,255,0.6)" }}>
          热门页面 Top 10（近 7 天）
        </h3>
        {topPages.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
            暂无数据
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {topPages.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "5px 0",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.25)",
                    minWidth: 18,
                    textAlign: "right",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.7)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.path}
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.35)",
                    minWidth: 40,
                    textAlign: "right",
                  }}
                >
                  {p.cnt}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
