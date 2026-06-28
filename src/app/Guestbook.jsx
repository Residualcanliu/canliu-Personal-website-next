"use client";

import { useState, useEffect, useRef } from "react";

export default function Guestbook({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [msgStatus, setMsgStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const fadeTimer = useRef(null);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => setMessages(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // 提交成功提示 3 秒后淡出
  useEffect(() => {
    if (submitted) {
      clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => setSubmitted(false), 3000);
    }
    return () => clearTimeout(fadeTimer.current);
  }, [submitted]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSending(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), content: content.trim(), msgStatus: msgStatus.trim() }),
      });
      setSubmitted(true);
      setName("");
      setContent("");
      setMsgStatus("");
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  const inputBase = {
    padding: "8px 12px",
    fontSize: "0.85rem",
    color: "#fff",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <>
      {/* 留言气泡 —— 左右交替排列在整个 panel 内 */}
      {messages.map((m, i) => {
        const isLeft = i % 2 === 0;
        return (
          <div
            key={m.id}
            className="msg-bubble"
            style={{
              position: "absolute",
              [isLeft ? "left" : "right"]: "4vw",
              top: `${14 + i * 9}vh`,
              maxWidth: "26vw",
              minWidth: "16vw",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: isLeft ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
              fontSize: "0.8rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(8px)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <span style={{ fontWeight: 500, color: "rgba(255,255,255,0.7)", fontSize: "0.8rem" }}>
              {m.name}
            </span>
            {m.msgStatus && (
              <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>
                · {m.msgStatus}
              </span>
            )}
            <span style={{ display: "block", marginTop: 3 }}>{m.content}</span>
          </div>
        );
      })}

      {/* 底部留言区域 */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "12px 0 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 3,
      }}>
        <a onClick={onBack} style={{
          marginBottom: 10,
          fontSize: ".78rem",
          color: "rgba(255,255,255,0.3)",
          cursor: "pointer",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
          onMouseEnter={(e) => e.target.style.color = "rgba(255,255,255,0.6)"}
          onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.3)"}
        >
          ← 返回主页
        </a>
        {!showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "8px 22px",
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.05)",
              border: "1px dashed rgba(255,255,255,0.12)",
              borderRadius: 8,
              cursor: "pointer",
              transition: "color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "rgba(255,255,255,0.8)";
              e.target.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "rgba(255,255,255,0.5)";
              e.target.style.background = "rgba(255,255,255,0.05)";
            }}
          >
            留下足迹
          </button>
        )}

        {submitted && (
          <p style={{
            color: "rgba(100,255,150,0.7)",
            fontSize: "0.82rem",
            transition: "opacity 0.5s",
            opacity: submitted ? 1 : 0,
          }}>
            留言已提交，审核通过后将展示在这里。
          </p>
        )}

        {showForm && !submitted && (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              width: "100%",
              maxWidth: 440,
              padding: "0 24px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ ...inputBase, flex: "1 1 0" }}
                placeholder="昵称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                required
              />
              <input
                style={{ ...inputBase, flex: "1 1 0" }}
                placeholder="状态（选填）"
                value={msgStatus}
                onChange={(e) => setMsgStatus(e.target.value)}
                maxLength={60}
              />
            </div>
            <textarea
              style={{ ...inputBase, minHeight: 60, resize: "vertical" }}
              placeholder="说点什么..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={2}
              required
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: "5px 14px",
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.4)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={sending}
                style={{
                  padding: "6px 18px",
                  fontSize: "0.8rem",
                  color: "#fff",
                  background: "rgba(100,160,255,0.2)",
                  border: "1px solid rgba(100,160,255,0.3)",
                  borderRadius: 6,
                  cursor: sending ? "not-allowed" : "pointer",
                  opacity: sending ? 0.5 : 1,
                }}
              >
                {sending ? "提交中..." : "留言"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
