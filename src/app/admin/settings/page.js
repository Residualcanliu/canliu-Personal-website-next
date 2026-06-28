"use client";

import { useState, useEffect } from "react";

const COLORS = ["#4f4", "#6af", "#fd0", "#f90", "#f66", "#c6f", "#0ff", "#999", "#fff"];

export default function AdminSettingsPage() {
  const [status, setStatus] = useState("");
  const [color, setColor] = useState("#4f4");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings?key=status").then((r) => r.json()),
      fetch("/api/settings?key=statusColor").then((r) => r.json()),
    ])
      .then(([s, c]) => {
        setStatus(s.value || "");
        setColor(c.value || "#4f4");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaved(false);
    await Promise.all([
      fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "status", value: status }),
      }),
      fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "statusColor", value: color }),
      }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: "36px 32px", maxWidth: 640 }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 500, marginBottom: 6 }}>
        网站设置
      </h2>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginBottom: 28 }}>
        基础配置，改动后即时生效。
      </p>

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.25)" }}>加载中...</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
              个人状态文字
            </label>
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="例如：正在探索宇宙..."
              maxLength={60}
              style={{
                padding: "10px 14px",
                fontSize: "0.9rem",
                color: "#fff",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
              状态圆点颜色
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: c,
                    border: color === c ? "2px solid #fff" : "2px solid rgba(255,255,255,0.2)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              style={{
                padding: "10px 24px",
                fontSize: "0.88rem",
                color: "#fff",
                background: "rgba(100,180,255,0.25)",
                border: "1px solid rgba(100,180,255,0.35)",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              保存
            </button>
            {saved && (
              <span style={{ fontSize: "0.8rem", color: "rgba(100,255,150,0.7)" }}>
                已保存
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
