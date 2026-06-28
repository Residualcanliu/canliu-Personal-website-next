"use client";

import Link from "next/link";
import ArticleForm from "../ArticleForm";

export default function NewArticlePage() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 500, marginBottom: 24 }}>
        写文章
      </h2>
      <ArticleForm />
      <Link
        href="/admin/articles"
        style={{
          display: "inline-block",
          marginTop: 20,
          fontSize: "0.82rem",
          color: "rgba(255,255,255,0.35)",
          textDecoration: "none",
        }}
      >
        ← 返回文章列表
      </Link>
    </div>
  );
}
