"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectForm({ initial = null }) {
  const router = useRouter();
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [tags, setTags] = useState(initial?.tags || "");
  const [link, setLink] = useState(initial?.link || "");
  const [linkMode, setLinkMode] = useState(initial?.link ? "url" : "text");
  const [published, setPublished] = useState(!!initial?.published);
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) return alert("标题不能为空");
    setSaving(true);
    const body = { title, content, tags, link: linkMode === "url" ? link : "", published };
    const url = isEdit ? `/api/admin/projects/${initial.id}` : "/api/admin/projects";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) return router.push("/admin/login");
      if (!res.ok) {
        const err = await res.json();
        alert("保存失败：" + (err.error || res.status));
        return;
      }
      router.push("/admin/projects");
    } catch {
      alert("网络错误");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = { display: "flex", flexDirection: "column", gap: 4 };
  const labelStyle = { fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 };
  const inputStyle = {
    padding: "9px 12px", fontSize: "0.9rem", color: "#fff",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6, outline: "none",
  };

  return (
    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={fieldStyle}>
        <label style={labelStyle}>标题 *</label>
        <input style={inputStyle} value={title}
          onChange={e => setTitle(e.target.value)} placeholder="项目名称" required />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>标签（英文逗号分隔，如：WebGL 2, Next.js, 光线追踪）</label>
        <input style={inputStyle} value={tags}
          onChange={e => setTags(e.target.value)} placeholder="WebGL 2, Next.js, 光线追踪" />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>项目类型</label>
        <div style={{ display: "flex", gap: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", cursor: "pointer" }}>
            <input type="radio" name="linkMode" checked={linkMode === "url"}
              onChange={() => setLinkMode("url")}
              style={{ width: 16, height: 16, cursor: "pointer" }} />
            超链接（点击跳转外部地址）
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", cursor: "pointer" }}>
            <input type="radio" name="linkMode" checked={linkMode === "text"}
              onChange={() => { setLinkMode("text"); setLink(""); }}
              style={{ width: 16, height: 16, cursor: "pointer" }} />
            纯文字（暂不公开 / 闭源项目）
          </label>
        </div>
      </div>

      {linkMode === "url" && (
        <div style={fieldStyle}>
          <label style={labelStyle}>链接地址</label>
          <input style={inputStyle} value={link}
            onChange={e => setLink(e.target.value)} placeholder="https://github.com/..." />
        </div>
      )}

      <div style={fieldStyle}>
        <label style={labelStyle}>正文（Markdown）</label>
        <textarea
          style={{
            ...inputStyle, minHeight: 280, resize: "vertical",
            fontFamily: '"SF Mono","Fira Code",monospace', fontSize: "0.85rem", lineHeight: 1.7,
          }}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="## 项目介绍&#10;&#10;这里写详细介绍...&#10;&#10;### 技术栈&#10;- xxx&#10;- yyy"
          rows={16}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input type="checkbox" id="pub" checked={published}
          onChange={e => setPublished(e.target.checked)}
          style={{ width: 18, height: 18, cursor: "pointer" }} />
        <label htmlFor="pub" style={{ fontSize: "0.88rem", cursor: "pointer" }}>
          发布（勾选后公开可见）
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button type="submit" disabled={saving}
          style={{
            padding: "10px 28px", fontSize: "0.9rem", color: "#fff",
            background: "rgba(100,180,255,0.3)", border: "1px solid rgba(100,180,255,0.4)",
            borderRadius: 7, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1,
          }}>
          {saving ? "保存中..." : isEdit ? "更新项目" : "创建项目"}
        </button>
      </div>
    </form>
  );
}
