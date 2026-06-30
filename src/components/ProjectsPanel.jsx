"use client";

import { useState, useEffect } from "react";

const ICONS = ["🕳", "🤖", "⛏", "🌟", "🔧", "🎮"];

export default function ProjectsPanel({ onBack }) {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => setProjects(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const angles = [-30, 110, 230];
  const dists = [0.22, 0.38, 0.52];

  const handleCardClick = (id) => {
    if (selected === id) return; // already selected
    setSelected(selected === null ? id : null);
  };

  const selProj = projects.find(p => p.id === selected);

  // Escape 键关闭详情
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <div style={{
        position: "relative",
        width: "min(90vw, 700px)",
        height: "min(80vh, 600px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
      {/* 详情遮罩层 — 点击关闭 */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "absolute", inset: 0, zIndex: 8,
            cursor: "pointer",
          }}
        />
      )}

      {/* 中心恒星 */}
      <div style={{
        position: "absolute",
        width: 16, height: 16,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,180,255,0.9) 0%, rgba(140,120,220,0.4) 40%, transparent 70%)",
        boxShadow: "0 0 30px rgba(180,160,240,0.6), 0 0 80px rgba(140,120,220,0.3), 0 0 150px rgba(100,80,200,0.15)",
        zIndex: 1,
        opacity: selected ? 0.3 : 1,
        transition: "opacity 0.5s",
      }} />

      {/* 轨道环 */}
      {[0.35, 0.55, 0.72].map((size, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${size * 100}%`,
          paddingBottom: `${size * 55}%`,
          borderRadius: "50%",
          border: "1px solid rgba(180,200,240,0.06)",
          transform: `rotate(${i * 15}deg)`,
          pointerEvents: "none",
          opacity: selected ? 0.2 : 1,
          transition: "opacity 0.5s",
        }} />
      ))}

      {loading && (
        <div style={{ position:"absolute", color:"rgba(255,255,255,0.3)", fontSize:"0.9rem", zIndex:5 }}>
          加载中...
        </div>
      )}
      {!loading && projects.length === 0 && (
        <div style={{ position:"absolute", color:"rgba(255,255,255,0.2)", fontSize:"0.85rem", zIndex:5 }}>
          暂无项目
        </div>
      )}

      {/* 项目卡片 */}
      {projects.map((proj, i) => {
        const isSel = selected === proj.id;
        const isOtherSel = selected && selected !== proj.id;
        const angle = (angles[i] * Math.PI) / 180;
        const dist = dists[i];
        const tagList = (proj.tags || "").split(",").map(t => t.trim()).filter(Boolean);
        const plainContent = (proj.content || "").replace(/[#*`\[\]()>!\-\|]/g, "").replace(/\n/g, " ").trim();
        const shortDesc = plainContent.substring(0, 80) + (plainContent.length > 80 ? "..." : "");

        // 轨道位置
        const orbX = 50 + Math.cos(angle) * dist * 100;
        const orbY = 50 + Math.sin(angle) * dist * 100 * 0.55;

        return (
          <div
            key={proj.id}
            style={{
              position: "absolute",
              left: isSel ? "50%" : `${orbX}%`,
              top: isSel ? "50%" : `${orbY}%`,
              transform: isSel ? "translate(-50%, -50%)" : "translate(-50%, -50%)",
              width: isSel ? "min(420px, 82vw)" : "min(200px, 38vw)",
              padding: isSel ? "24px 28px" : "16px 18px",
              background: isSel ? "rgba(18,18,36,0.95)" : "rgba(15,15,30,0.85)",
              border: isSel
                ? "1px solid rgba(180,200,255,0.3)"
                : "1px solid rgba(180,200,240,0.12)",
              borderRadius: isSel ? 18 : 14,
              cursor: "pointer",
              transition: "left 0.5s cubic-bezier(0.4,0,0.2,1), top 0.5s cubic-bezier(0.4,0,0.2,1), width 0.5s cubic-bezier(0.4,0,0.2,1), padding 0.5s, border-color 0.3s, box-shadow 0.3s, opacity 0.5s",
              boxShadow: isSel ? "0 0 40px rgba(160,180,240,0.25), 0 0 100px rgba(120,140,220,0.1)" : "none",
              opacity: isOtherSel ? 0.15 : 1,
              zIndex: isSel ? 10 : 2,
            }}
            onClick={(e) => { e.stopPropagation(); handleCardClick(proj.id); }}
          >
            {/* 详情关闭按钮 */}
            {isSel && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(null); }}
                style={{
                  position: "absolute", top: 10, right: 14,
                  fontSize: "1.2rem", color: "rgba(255,255,255,0.3)",
                  background: "none", border: "none", cursor: "pointer",
                  zIndex: 5, lineHeight: 1,
                }}
                onMouseEnter={e => { e.target.style.color = "rgba(255,255,255,0.7)"; }}
                onMouseLeave={e => { e.target.style.color = "rgba(255,255,255,0.3)"; }}
              >×</button>
            )}

            {/* 标题行 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isSel ? 10 : 6 }}>
              <span style={{ fontSize: isSel ? "2rem" : "1.6rem", transition: "font-size 0.5s" }}>
                {ICONS[i % ICONS.length]}
              </span>
              <span style={{
                fontSize: isSel ? "1.15rem" : "0.9rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                transition: "font-size 0.5s",
              }}>
                {proj.title}
              </span>
            </div>

            {/* 简介 / 详情 */}
            <div style={{
              fontSize: isSel ? "0.82rem" : "0.7rem",
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.6,
              marginBottom: isSel ? 14 : 10,
              transition: "font-size 0.5s",
            }}>
              {isSel ? proj.content : (shortDesc || "暂无描述")}
            </div>

            {/* 标签 */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: isSel ? 14 : 0 }}>
              {tagList.map(tag => (
                <span key={tag} style={{
                  fontSize: isSel ? "0.68rem" : "0.62rem",
                  padding: isSel ? "3px 9px" : "2px 7px",
                  borderRadius: 3,
                  color: "rgba(200,210,240,0.6)",
                  background: "rgba(180,200,240,0.08)",
                  border: "1px solid rgba(180,200,240,0.1)",
                  transition: "font-size 0.5s, padding 0.5s",
                }}>{tag}</span>
              ))}
            </div>

            {/* 详情专属内容：过渡 + 链接 */}
            {isSel && (
              <div style={{
                animation: "fadeInUp 0.4s ease-out",
                borderTop: "1px solid rgba(180,200,240,0.1)",
                paddingTop: 12,
              }}>
                {proj.link ? (
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noopener"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 14px",
                      fontSize: "0.75rem",
                      color: "rgba(200,220,255,0.7)",
                      background: "rgba(140,180,240,0.1)",
                      border: "1px solid rgba(140,180,240,0.2)",
                      borderRadius: 6,
                      textDecoration: "none",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => { e.target.style.background = "rgba(140,180,240,0.18)"; }}
                    onMouseLeave={e => { e.target.style.background = "rgba(140,180,240,0.1)"; }}
                  >
                    GitHub →
                  </a>
                ) : (
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
                    链接待补充
                  </span>
                )}
                <div style={{ marginTop: 10, fontSize: "0.65rem", color: "rgba(255,255,255,0.2)" }}>
                  点击空白处返回轨道视图
                </div>
              </div>
            )}

            {/* 轨道视图的点击提示 */}
            {!selected && (
              <div style={{ marginTop: 6, fontSize: "0.6rem", color: "rgba(180,200,240,0.2)" }}>
                点击查看详情
              </div>
            )}
          </div>
        );
      })}

      {/* 返回主页 */}
      <a
        onClick={onBack}
        style={{
          position: "absolute",
          bottom: -10,
          fontSize: "0.82rem",
          color: "rgba(255,255,255,0.3)",
          cursor: "pointer",
          textDecoration: "none",
          transition: "color 0.2s",
          zIndex: 20,
        }}
        onMouseEnter={e => { e.target.style.color = "rgba(255,255,255,0.6)"; }}
        onMouseLeave={e => { e.target.style.color = "rgba(255,255,255,0.3)"; }}
      >← 返回主页</a>

    </div>
  );
}
