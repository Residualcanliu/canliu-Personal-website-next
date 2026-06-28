"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ArticleForm from "../../ArticleForm";

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/articles/${params.id}`);
        if (res.status === 401) return router.push("/admin/login");
        if (!res.ok) {
          setError("文章不存在");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setArticle(data);
      } catch {
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, router]);

  if (loading) {
    return (
      <div style={{ padding: 40, color: "rgba(255,255,255,0.35)" }}>
        加载中...
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: 40, color: "rgba(255,120,120,0.8)" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 500, marginBottom: 24 }}>
        编辑文章
      </h2>
      <ArticleForm initial={article} />
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
