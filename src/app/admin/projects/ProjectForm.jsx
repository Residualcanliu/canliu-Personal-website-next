"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectForm({ initial }) {
  const router = useRouter();
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [tags, setTags] = useState(initial?.tags || "");
  const [link, setLink] = useState(initial?.link || "");
  const [published, setPublished] = useState(initial ? !!initial.published : false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("请输入项目标题");
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/projects/${initial.id}` : "/api/admin/projects";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content, tags: tags.trim(), link: link.trim(), published }),
      });
      if (res.status === 401) { router.push("/admin/login"); return; }
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "保存失败");
        return;
      }
      router.push("/admin/projects");
    } catch (err) {
      alert("网络错误: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>标题 *</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          style={inp} placeholder="项目名称" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>标签（逗号分隔，如：WebGL 2, Next.js, GLSL）</label>
        <input value={tags} onChange={e => setTags(e.target.value)}
          style={inp} placeholder="WebGL 2, Next.js, GLSL" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>链接</label>
        <input value={link} onChange={e => setLink(e.target.value)}
          style={inp} placeholder="https://github.com/..." />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>内容（Markdown）</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          rows={14}
          style={{ ...inp, fontFamily: "Consolas, Monaco, \"Courier New\", monospace", resize: "vertical" }}
          placeholder={"## 项目介绍\n\n这里写详细介绍...\n\n### 技术栈\n- xxx\n- yyy"} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}
            style={{ width: 16, height: 16 }} />
          发布
        </label>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={saving}
          style={{
            padding: "8px 24px", fontSize: "0.9rem",
            color: "#fff", background: "#3b82f6", border: "none", borderRadius: 6, cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}>
          {saving ? "保存中..." : isEdit ? "更新" : "创建"}
        </button>
        <button type="button" onClick={() => router.push("/admin/projects")}
          style={{
            padding: "8px 20px", fontSize: "0.9rem",
            color: "#9ca3af", background: "#1f2937", border: "1px solid #374151", borderRadius: 6, cursor: "pointer",
          }}>
          取消
        </button>
      </div>
    </form>
  );
}

const lbl = { display: "block", fontSize: "0.85rem", color: "#9ca3af", marginBottom: 6 };
const inp = {
  width: "100%", padding: "8px 12px", fontSize: "0.9rem",
  color: "#e5e7eb", background: "#111827",
  border: "1px solid #374151", borderRadius: 6, outline: "none",
};
