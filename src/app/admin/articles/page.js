"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminArticlesPage() {
  const router = useRouter();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles");
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function handleDelete(id) {
    if (!confirm("确定删除这篇文章？")) return;
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    fetchList();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: "1.3rem", fontWeight: 500 }}>文章管理</h2>
        <button
          onClick={() => router.push("/admin/articles/new")}
          style={{
            padding: "8px 20px",
            fontSize: "0.88rem",
            color: "#fff",
            background: "rgba(100,140,255,0.25)",
            border: "1px solid rgba(100,140,255,0.35)",
            borderRadius: 7,
            cursor: "pointer",
          }}
        >
          ＋ 写文章
        </button>
      </div>

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.35)" }}>加载中...</p>
      ) : !rows || rows.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.35)" }}>
          还没有文章，点击「写文章」开始。
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.title}
                </div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  {a.slug}
                  {" · "}
                  {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString("zh-CN") : ""}
                  {" · "}
                  <span style={{ color: a.published ? "#6f6" : "rgba(255,200,100,0.6)" }}>
                    {a.published ? "已发布" : "草稿"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 16 }}>
                <button
                  onClick={() => router.push(`/admin/articles/${a.id}/edit`)}
                  style={{
                    padding: "5px 14px",
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.6)",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 5,
                    cursor: "pointer",
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  style={{
                    padding: "5px 14px",
                    fontSize: "0.78rem",
                    color: "rgba(255,120,120,0.7)",
                    background: "rgba(255,60,60,0.08)",
                    border: "1px solid rgba(255,60,60,0.15)",
                    borderRadius: 5,
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

      <Link
        href="/admin"
        style={{
          display: "inline-block",
          marginTop: 28,
          fontSize: "0.82rem",
          color: "rgba(255,255,255,0.35)",
          textDecoration: "none",
        }}
      >
        ← 返回仪表盘
      </Link>
    </div>
  );
}
