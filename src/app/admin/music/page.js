"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminMusicPage() {
  const router = useRouter();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [useFile, setUseFile] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/music");
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch { setRows([]); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("请输入歌曲名");
    setSaving(true);
    const form = new FormData();
    form.append("title", title);
    form.append("artist", artist);
    if (useFile && file) {
      form.append("file", file);
    } else {
      form.append("url", url);
    }
    try {
      const res = await fetch("/api/upload-music", { method: "POST", body: form });
      if (!res.ok) { const d = await res.json(); alert(d.error || "上传失败"); return; }
      setTitle(""); setArtist(""); setUrl(""); setFile(null); setShowAdd(false);
      fetchList();
    } catch(e) { alert("错误: " + (e.message || "网络错误")); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/music/${id}`, { method: "DELETE" });
    fetchList();
  };

  const togglePublish = async (song) => {
    const form = new FormData();
    form.append("published", song.published ? "0" : "1");
    await fetch(`/api/admin/music/${song.id}`, { method: "PUT", body: form });
    fetchList();
  };

  const fld = { display: "flex", flexDirection: "column", gap: 4 };
  const lbl = { fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 };
  const inp = { padding: "9px 12px", fontSize: "0.9rem", color: "#fff", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, outline: "none" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 500 }}>音乐管理</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "8px 20px", fontSize: "0.88rem", color: "#fff", background: "rgba(100,140,255,0.25)", border: "1px solid rgba(100,140,255,0.35)", borderRadius: 7, cursor: "pointer" }}>
          {showAdd ? "收起" : "＋ 添加歌曲"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24, padding: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
          <div style={fld}>
            <label style={lbl}>歌曲名 *</label>
            <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="歌名" />
          </div>
          <div style={fld}>
            <label style={lbl}>歌手</label>
            <input style={inp} value={artist} onChange={e => setArtist(e.target.value)} placeholder="歌手名" />
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", cursor: "pointer" }}>
              <input type="radio" checked={useFile} onChange={() => setUseFile(true)} style={{ width: 16, height: 16 }} />
              上传文件
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", cursor: "pointer" }}>
              <input type="radio" checked={!useFile} onChange={() => setUseFile(false)} style={{ width: 16, height: 16 }} />
              贴链接
            </label>
          </div>
          {useFile ? (
            <input key="file" type="file" accept="audio/*" onChange={e => setFile((e.target.files && e.target.files[0]) || null)} style={{ color: "#9ca3af" }} />
          ) : (
            <input key="url" style={inp} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://...mp3" />
          )}
          <button type="submit" disabled={saving} style={{ padding: "10px 28px", fontSize: "0.9rem", color: "#fff", background: "rgba(100,180,255,0.3)", border: "1px solid rgba(100,180,255,0.4)", borderRadius: 7, cursor: "pointer", opacity: saving ? 0.5 : 1, alignSelf: "flex-start" }}>
            {saving ? "上传中..." : "添加"}
          </button>
        </form>
      )}

      {loading ? <p style={{ color: "rgba(255,255,255,0.35)" }}>加载中...</p>
       : !rows || rows.length === 0 ? <p style={{ color: "rgba(255,255,255,0.35)" }}>还没有歌曲。</p>
       : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.title}
                  <span style={{ marginLeft: 10, fontSize: "0.7rem", padding: "2px 7px", borderRadius: 3, color: s.published ? "#6f6" : "rgba(255,200,100,0.6)", background: s.published ? "rgba(134,239,172,0.1)" : "rgba(252,165,165,0.1)" }}>{s.published ? "已发布" : "草稿"}</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.artist || "未知歌手"} · {s.url}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 16 }}>
                <button onClick={() => togglePublish(s)} style={{ padding: "5px 14px", fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 5, cursor: "pointer" }}>{s.published ? "下架" : "发布"}</button>
                <button onClick={() => handleDelete(s.id)} style={{ padding: "5px 14px", fontSize: "0.78rem", color: "rgba(255,120,120,0.7)", background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.15)", borderRadius: 5, cursor: "pointer" }}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link href="/admin" style={{ display: "inline-block", marginTop: 28, fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>← 返回仪表盘</Link>
    </div>
  );
}
