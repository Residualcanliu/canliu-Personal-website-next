"use client";

import { useState, useEffect, useMemo } from "react";
import { marked } from "marked";

export default function ArticlesPanel({ userStatus, statusColor, onBack }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedContent, setExpandedContent] = useState({});

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (article) => {
    if (expandedId === article.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(article.id);
    if (!expandedContent[article.id]) {
      try {
        const res = await fetch(`/api/articles/${article.slug}`);
        if (res.ok) {
          const data = await res.json();
          setExpandedContent((prev) => ({ ...prev, [article.id]: data.content || "" }));
        }
      } catch {}
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return (
    <div style={{ display: "flex", width: "82vw", maxWidth: 960, gap: 44, alignItems: "flex-start", height: "78vh" }}>
      {/* 左侧 — 复用 profile 侧边栏 */}
      <div style={{ flex: "0 0 180px", textAlign: "center", paddingTop: 8 }}>
        <img src="/cat.jpg" alt="avatar" className="avatar-img" style={{ margin: "0 auto 16px" }} />
        <div style={{ fontSize: "0.95rem", color: "rgba(255,255,255,.85)", fontWeight: 500 }}>gch / 残留v枫楪</div>
        <div className="status" style={{ marginTop: 8 }}>
          <span className="status-dot" style={{ background: userStatus ? statusColor : "#f44" }} />
          {userStatus || "加载中..."}
        </div>
        <div className="profile-tags" style={{ marginTop: 10 }}>
          <span>AI agent</span><span>个人博客</span><span>喵～</span><span>大数据专业</span><span>CS</span><span>MC</span>
        </div>
      </div>

      {/* 右侧 — 滑动文章卡片流 */}
      <div style={{ flex: 1, minWidth: 0, height: "100%", overflowY: "auto", paddingRight: 8 }}>
        {loading ? (
          <div style={{ color: "rgba(255,255,255,.35)", fontSize: ".9rem", textAlign: "center", paddingTop: 60 }}>
            加载中...
          </div>
        ) : articles.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: ".9rem", textAlign: "center", paddingTop: 60 }}>
            还没有文章，敬请期待
          </div>
        ) : (
          articles.map((a) => {
            const isExpanded = expandedId === a.id;
            const content = expandedContent[a.id];
            return (
              <div
                key={a.id}
                className={`article-card${isExpanded ? " expanded" : ""}`}
                onClick={() => toggleExpand(a)}
              >
                <div className="article-card-header">
                  <h3>{a.title}</h3>
                  <span className="article-card-date">{formatDate(a.createdAt)}</span>
                </div>
                {a.excerpt && <p className="article-card-excerpt">{a.excerpt}</p>}
                <span className="article-card-toggle">
                  {isExpanded ? "收起" : "展开阅读"}
                </span>
                {isExpanded && (
                  <div className="article-card-body">
                    {content === undefined ? (
                      <span style={{ color: "rgba(255,255,255,.3)" }}>加载中...</span>
                    ) : (
                      <div
                        className="md-content"
                        dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* 底部 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 24, paddingBottom: 20 }}>
          {onBack && (
            <a className="home-btn" style={{ marginTop: 0 }} onClick={onBack}>
              返回主页
            </a>
          )}
          <a
            href="/admin/articles"
            style={{
              color: "rgba(255,255,255,.25)",
              textDecoration: "none",
              fontSize: ".8rem",
              transition: "color .3s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "rgba(255,255,255,.5)")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,.25)")}
          >
            管理文章
          </a>
        </div>
      </div>
    </div>
  );
}
