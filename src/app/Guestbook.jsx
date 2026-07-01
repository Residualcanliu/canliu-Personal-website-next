"use client";

import { useState, useEffect, useRef } from "react";

const STATUS_EMOJIS = ["", "🟢", "🔵", "🟡", "🟠", "🔴", "🟣", "⚫", "✨", "🔥", "💤", "🎮", "📚", "🎵", "☕", "🌈", "💡", "🚀", "🌙", "⭐"];

export default function Guestbook({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [msgEmoji, setMsgEmoji] = useState("");
  const [msgText, setMsgText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
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
        body: JSON.stringify({ name: name.trim(), content: content.trim(), msgStatus: (msgEmoji + " " + msgText.trim()).trim() }),
      });
      setSubmitted(true);
      setName("");
      setContent("");
      setMsgEmoji("");
      setMsgText("");
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
        const bubbleRadius = isLeft ? "4px 14px 14px 14px" : "14px 4px 14px 14px";
        return (
          <div
            key={m.id}
            style={{
              position: "absolute",
              [isLeft ? "left" : "right"]: "4vw",
              top: `${14 + i * 9}vh`,
              maxWidth: "26vw",
              minWidth: "16vw",
              zIndex: 2,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: isLeft ? "flex-start" : "flex-end",
            }}
          >
            {/* 主气泡 */}
            <div
              className="msg-bubble"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: bubbleRadius,
                fontSize: "0.8rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(8px)",
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontWeight: 500, color: "rgba(255,255,255,0.7)", fontSize: "0.8rem" }}>
                {m.name}
                {m.msgStatus && <span style={{ marginLeft: 6, fontWeight: 400 }}>{m.msgStatus}</span>}
              </span>
              <span style={{ display: "block", marginTop: 3 }}>{m.content}</span>
            </div>

            {/* 回复气泡 */}
            {m.reply && (
              <div
                style={{
                  marginTop: -1,
                  maxWidth: "90%",
                  padding: "6px 12px",
                  background: "rgba(100,160,255,0.06)",
                  border: "1px solid rgba(100,160,255,0.1)",
                  borderRadius: isLeft ? "0 0 10px 10px" : "0 0 10px 10px",
                  fontSize: "0.72rem",
                  lineHeight: 1.5,
                  color: "rgba(180,210,255,0.6)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span style={{ color: "rgba(160,200,255,0.5)", fontWeight: 500, marginRight: 2 }}>回复：</span>
                {m.reply}
              </div>
            )}
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
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input
                style={{ ...inputBase, flex: "1 1 0" }}
                placeholder="昵称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                required
              />
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                style={{
                  padding: "6px 8px",
                  fontSize: "1.1rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  cursor: "pointer",
                  minWidth: 34,
                  flexShrink: 0,
                }}
              >
                {msgEmoji || "😊"}
              </button>
              <input
                style={{ ...inputBase, flex: "1 1 0" }}
                placeholder="状态文字"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                maxLength={30}
              />
            </div>
            {showEmoji && (
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                padding: "4px 0",
              }}>
                {STATUS_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { setMsgEmoji(e); setShowEmoji(false); }}
                    style={{
                      width: 32,
                      height: 32,
                      fontSize: "1rem",
                      background: msgEmoji === e ? "rgba(100,160,255,0.2)" : "rgba(255,255,255,0.03)",
                      border: msgEmoji === e ? "1px solid rgba(100,160,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {e || "—"}
                  </button>
                ))}
              </div>
            )}
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
