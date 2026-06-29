"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArticleForm({ initial = null }) {
  const router = useRouter();
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [content, setContent] = useState(initial?.content || "");
  const [published, setPublished] = useState(!!initial?.published);
  const [allowComments, setAllowComments] = useState(initial ? !!initial.allowComments : true);
  const [saving, setSaving] = useState(false);

  function handleTitleChange(e) {
    const v = e.target.value;
    setTitle(v);
    // 新建模式下自动生成 slug
    if (!isEdit && !slug) {
      setSlug(
        v
          .replace(/[^a-zA-Z0-9一-龥]+/g, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase()
      );
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) return alert("标题不能为空");
    setSaving(true);
    const body = { title, slug: slug || undefined, excerpt, content, published, allowComments };
    const url = isEdit ? `/api/admin/articles/${initial.id}` : "/api/admin/articles";
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
      router.push("/admin/articles");
    } catch {
      alert("网络错误");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };
  const labelStyle = {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.45)",
    fontWeight: 500,
  };
  const inputStyle = {
    padding: "9px 12px",
    fontSize: "0.9rem",
    color: "#fff",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    outline: "none",
  };

  return (
    <form
      onSubmit={handleSave}
      style={{ display: "flex", flexDirection: "column", gap: 18 }}
    >
      <div style={fieldStyle}>
        <label style={labelStyle}>标题 *</label>
        <input
          style={inputStyle}
          value={title}
          onChange={handleTitleChange}
          placeholder="文章标题"
          required
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Slug（URL 标识，留空则自动生成）</label>
        <input
          style={inputStyle}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-article-slug"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>摘要</label>
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="简短描述，显示在文章列表中"
          rows={2}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>正文（Markdown）</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: 280,
            resize: "vertical",
            fontFamily: '"SF Mono","Fira Code",monospace',
            fontSize: "0.85rem",
            lineHeight: 1.7,
          }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="## 开始写作...&#10;&#10;支持 Markdown 语法。"
          rows={16}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="checkbox"
          id="pub"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          style={{ width: 18, height: 18, cursor: "pointer" }}
        />
        <label htmlFor="pub" style={{ fontSize: "0.88rem", cursor: "pointer" }}>
          发布（勾选后公开可见）
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="checkbox"
          id="ac"
          checked={allowComments}
          onChange={(e) => setAllowComments(e.target.checked)}
          style={{ width: 18, height: 18, cursor: "pointer" }}
        />
        <label htmlFor="ac" style={{ fontSize: "0.88rem", cursor: "pointer" }}>
          允许评论（勾选后读者可在文章下评论）
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 28px",
            fontSize: "0.9rem",
            color: "#fff",
            background: "rgba(100,180,255,0.3)",
            border: "1px solid rgba(100,180,255,0.4)",
            borderRadius: 7,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? "保存中..." : isEdit ? "更新文章" : "创建文章"}
        </button>
      </div>
    </form>
  );
}
