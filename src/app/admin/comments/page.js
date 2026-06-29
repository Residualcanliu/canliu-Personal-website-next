"use client";

import { useState, useEffect, useCallback } from "react";

const statusMap = { 0: "待审", 1: "通过", "-1": "拒绝" };

export default function AdminCommentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/comments");
      if (res.status === 401) return (window.location.href = "/admin/login");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const approve = async (id, val) => {
    await fetch(`/api/admin/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: val }),
    });
    fetchList();
  };

  const del = async (id) => {
    if (!confirm("确定删除此评论？")) return;
    await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    fetchList();
  };

  const th = { padding: "10px 16px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,.08)", fontSize: ".82rem", color: "rgba(255,255,255,.5)", fontWeight: 500 };
  const td = { padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: ".85rem", color: "rgba(255,255,255,.65)" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 500, color: "#fff", margin: 0 }}>评论管理</h2>
          <p style={{ fontSize: ".82rem", color: "rgba(255,255,255,.35)", margin: "4px 0 0" }}>{rows.length} 条评论</p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,.3)", padding: 40 }}>加载中...</div>
      ) : rows.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,.25)", padding: 40 }}>暂无评论</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>昵称</th>
                <th style={th}>内容</th>
                <th style={{ ...th, width: 90 }}>状态</th>
                <th style={{ ...th, width: 110 }}>时间</th>
                <th style={{ ...th, width: 160 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.name}</td>
                  <td style={{ ...td, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.content}</td>
                  <td style={td}>{statusMap[String(r.approved)] || r.approved}</td>
                  <td style={{ ...td, fontSize: ".78rem" }}>{r.createdAt ? new Date(r.createdAt).toLocaleString("zh-CN") : ""}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => approve(r.id, 1)} style={btnStyle("rgba(100,200,100,.25)", "rgba(100,200,100,.8)")}>通过</button>
                      <button onClick={() => approve(r.id, -1)} style={btnStyle("rgba(200,150,50,.25)", "rgba(200,150,50,.8)")}>拒绝</button>
                      <button onClick={() => del(r.id)} style={btnStyle("rgba(200,80,80,.2)", "rgba(200,80,80,.7)")}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg, color) {
  return {
    padding: "3px 10px",
    fontSize: ".72rem",
    color,
    background: bg,
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}
