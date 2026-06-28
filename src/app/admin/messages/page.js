"use client";

import { useState, useEffect, useCallback } from "react";

export default function AdminMessagesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  async function handleAction(id, approved) {
    await fetch(`/api/admin/messages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    fetchList();
  }

  async function handleDelete(id) {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    fetchList();
  }

  const badgeStyle = (approved) => ({
    fontSize: "0.7rem",
    padding: "2px 8px",
    borderRadius: 4,
    color:
      approved === 1 ? "rgba(100,255,150,0.8)" : approved === -1 ? "rgba(255,100,100,0.8)" : "rgba(255,200,100,0.8)",
    background:
      approved === 1 ? "rgba(100,255,150,0.08)" : approved === -1 ? "rgba(255,100,100,0.08)" : "rgba(255,200,100,0.08)",
  });

  return (
    <div style={{ padding: "36px 32px", maxWidth: 960 }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 500, marginBottom: 6 }}>
        留言管理
      </h2>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginBottom: 24 }}>
        审核用户留言：通过后公开展示，拒绝后不展示。
      </p>

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.25)" }}>加载中...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.25)" }}>暂无留言。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((m) => (
            <div
              key={m.id}
              style={{
                padding: "14px 18px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{m.name}</span>
                {m.msgStatus && (
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>· {m.msgStatus}</span>
                )}
                <span style={badgeStyle(m.approved)}>
                  {m.approved === 1 ? "已通过" : m.approved === -1 ? "已拒绝" : "待审核"}
                </span>
                <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleString("zh-CN") : ""}
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", margin: "4px 0 8px", lineHeight: 1.6 }}>
                {m.content}
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {m.approved !== 1 && (
                  <button
                    onClick={() => handleAction(m.id, 1)}
                    style={{
                      padding: "3px 12px",
                      fontSize: "0.75rem",
                      color: "rgba(100,255,150,0.7)",
                      background: "rgba(100,255,150,0.08)",
                      border: "1px solid rgba(100,255,150,0.15)",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    通过
                  </button>
                )}
                {m.approved !== -1 && (
                  <button
                    onClick={() => handleAction(m.id, -1)}
                    style={{
                      padding: "3px 12px",
                      fontSize: "0.75rem",
                      color: "rgba(255,150,100,0.7)",
                      background: "rgba(255,150,100,0.08)",
                      border: "1px solid rgba(255,150,100,0.15)",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    拒绝
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  style={{
                    padding: "3px 12px",
                    fontSize: "0.75rem",
                    color: "rgba(255,120,120,0.6)",
                    background: "rgba(255,60,60,0.06)",
                    border: "1px solid rgba(255,60,60,0.1)",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
