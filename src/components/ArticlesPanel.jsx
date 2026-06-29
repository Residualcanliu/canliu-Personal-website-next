"use client";

import { useState, useEffect } from "react";
import { marked } from "marked";

export default function ArticlesPanel({ userStatus, statusColor, onBack }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedContent, setExpandedContent] = useState({});
  const [comments, setComments] = useState({});

  // 每篇文章独立的评论表单状态
  const [cmtForm, setCmtForm] = useState({}); // articleId -> { name, text, saving, msg }

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
          setExpandedContent((prev) => ({
            ...prev,
            [article.id]: { content: data.content || "", allowComments: data.allowComments },
          }));
          if (data.allowComments) {
            fetchComments(article.slug, article.id);
          }
        }
      } catch {}
    }
  };

  const fetchComments = async (slug, articleId) => {
    try {
      const res = await fetch(`/api/comments?articleSlug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({ ...prev, [articleId]: data }));
      }
    } catch {}
  };

  const submitComment = async (articleSlug, articleId) => {
    const f = cmtForm[articleId] || { name: "", text: "" };
    if (!f.name.trim() || !f.text.trim()) {
      setCmtForm((prev) => ({ ...prev, [articleId]: { ...f, msg: "请填写昵称和评论内容" } }));
      return;
    }
    setCmtForm((prev) => ({ ...prev, [articleId]: { ...f, saving: true, msg: "" } }));
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleSlug, name: f.name, content: f.text }),
      });
      const data = await res.json();
      if (res.ok) {
        setCmtForm((prev) => ({ ...prev, [articleId]: { name: "", text: "", saving: false, msg: "提交成功，审核后显示" } }));
        fetchComments(articleSlug, articleId);
      } else {
        setCmtForm((prev) => ({ ...prev, [articleId]: { ...f, saving: false, msg: data.error || "提交失败" } }));
      }
    } catch {
      setCmtForm((prev) => ({ ...prev, [articleId]: { ...f, saving: false, msg: "网络错误" } }));
    }
  };

  const updateCmtForm = (articleId, key, value) => {
    setCmtForm((prev) => ({
      ...prev,
      [articleId]: { ...(prev[articleId] || { name: "", text: "" }), [key]: value },
    }));
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };

  const formatTime = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div style={{ display: "flex", width: "82vw", maxWidth: 960, gap: 44, alignItems: "flex-start", height: "78vh" }}>
      {/* 左侧 */}
      <div style={{ flex: "0 0 180px", textAlign: "center", paddingTop: 8 }}>
        <img src="/cat.jpg" alt="avatar" className="avatar-img" style={{ margin: "0 auto 16px" }} />
        <div style={{ fontSize: "0.95rem", color: "rgba(255,255,255,.85)", fontWeight: 500 }}>gch / 残留v枫楪</div>
        <div className="status" style={{ marginTop: 8, fontSize: "0.7rem" }}>
          <span className="status-dot" style={{ background: userStatus ? statusColor : "#f44" }} />
          {userStatus || "加载中..."}
        </div>
        <div className="profile-tags" style={{ marginTop: 10 }}>
          <span>AI agent</span><span>个人博客</span><span>喵～</span><span>大数据专业</span><span>CS</span><span>MC</span>
        </div>
      </div>

      {/* 右侧 */}
      <div style={{ flex: 1, minWidth: 0, height: "100%", overflowY: "auto", paddingRight: 8 }}>
        {loading ? (
          <div style={{ color: "rgba(255,255,255,.35)", fontSize: ".9rem", textAlign: "center", paddingTop: 60 }}>加载中...</div>
        ) : articles.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: ".9rem", textAlign: "center", paddingTop: 60 }}>还没有文章，敬请期待</div>
        ) : (
          articles.map((a) => {
            const isExpanded = expandedId === a.id;
            const c = expandedContent[a.id];
            const articleComments = comments[a.id] || [];
            const f = cmtForm[a.id] || { name: "", text: "" };

            return (
              <div key={a.id} className={`article-card${isExpanded ? " expanded" : ""}`} onClick={() => toggleExpand(a)}>
                <div className="article-card-header">
                  <h3>{a.title}</h3>
                  <span className="article-card-date">{formatDate(a.createdAt)}</span>
                </div>
                {a.excerpt && <p className="article-card-excerpt">{a.excerpt}</p>}
                <span className="article-card-toggle">{isExpanded ? "收起" : "展开阅读"}</span>

                {isExpanded && (
                  <div className="article-card-body">
                    {c === undefined ? (
                      <span style={{ color: "rgba(255,255,255,.3)" }}>加载中...</span>
                    ) : (
                      <>
                        {/* 文章正文框 */}
                        <div className="article-body-box">
                          <div className="md-content" dangerouslySetInnerHTML={{ __html: marked.parse(c.content) }} />
                        </div>

                        {/* 评论区 */}
                        {c.allowComments ? (
                          <div className="comment-section" onClick={(e) => e.stopPropagation()}>
                            <hr className="comment-divider" />
                            <div className="comment-section-title">评论 ({articleComments.length})</div>

                            {/* 评论列表（独立滚动） */}
                            {articleComments.length > 0 && (
                              <div className="comment-list">
                                {articleComments.map((cm) => (
                                  <div key={cm.id} className="comment-item">
                                    <div className="comment-meta">
                                      <span className="comment-name">{cm.name}</span>
                                      <span className="comment-time">{formatTime(cm.createdAt)}</span>
                                    </div>
                                    <div className="comment-content">{cm.content}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {articleComments.length === 0 && (
                              <div style={{ color: "rgba(255,255,255,.15)", fontSize: ".75rem", padding: "8px 0" }}>暂无评论，来写第一条</div>
                            )}

                            {/* 写评论框 */}
                            <hr className="comment-divider" />
                            <div className="comment-form-box" onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
                                <input
                                  className="comment-input"
                                  placeholder="昵称"
                                  value={f.name}
                                  onChange={(e) => updateCmtForm(a.id, "name", e.target.value)}
                                  maxLength={30}
                                />
                                <button
                                  className="comment-submit"
                                  disabled={f.saving}
                                  onClick={() => submitComment(a.slug, a.id)}
                                >
                                  {f.saving ? "..." : "发送"}
                                </button>
                              </div>
                              <textarea
                                className="comment-textarea"
                                placeholder="写下你的想法..."
                                value={f.text}
                                onChange={(e) => updateCmtForm(a.id, "text", e.target.value)}
                                maxLength={500}
                                rows={2}
                              />
                              {f.msg && <div className="comment-msg">{f.msg}</div>}
                            </div>
                          </div>
                        ) : (
                          <>
                            <hr className="comment-divider" />
                            <div className="comment-no-open">本文未开放评论</div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 24, paddingBottom: 20 }}>
          {onBack && <a className="home-btn" style={{ marginTop: 0 }} onClick={onBack}>返回主页</a>}
        </div>
      </div>
    </div>
  );
}
