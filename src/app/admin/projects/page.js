"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminProjectsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    const res = await fetch("/api/admin/projects");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("确定删除该项目？")) return;
    await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>项目管理</h1>
        <button
          onClick={() => router.push("/admin/projects/new")}
          style={{
            padding: "8px 18px", fontSize: "0.9rem",
            color: "#fff", background: "#3b82f6", border: "none", borderRadius: 6, cursor: "pointer",
          }}>
          + 新建项目
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#9ca3af" }}>加载中...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>还没有项目，点击上方按钮创建第一个</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map(p => (
            <div key={p.id} style={{
              padding: "14px 18px", background: "#111827", border: "1px solid #1f2937",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e5e7eb", marginBottom: 4 }}>
                  {p.title}
                  <span style={{
                    marginLeft: 10, fontSize: "0.7rem", padding: "2px 7px", borderRadius: 3,
                    color: p.published ? "#86efac" : "#fca5a5",
                    background: p.published ? "rgba(134,239,172,0.1)" : "rgba(252,165,165,0.1)",
                  }}>{p.published ? "已发布" : "草稿"}</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {p.tags || "无标签"} · {p.updatedAt ? new Date(p.updatedAt).toLocaleString("zh-CN") : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => router.push(`/admin/projects/${p.id}/edit`)} style={btn}>编辑</button>
                <button onClick={() => handleDelete(p.id)} style={{ ...btn, color: "#fca5a5" }}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <a onClick={() => router.push("/admin")} style={{ color: "#6b7280", cursor: "pointer", fontSize: "0.85rem" }}>
          ← 返回仪表盘
        </a>
      </div>
    </div>
  );
}

const btn = {
  padding: "5px 12px", fontSize: "0.78rem",
  color: "#9ca3af", background: "#1f2937", border: "1px solid #374151",
  borderRadius: 4, cursor: "pointer",
};
