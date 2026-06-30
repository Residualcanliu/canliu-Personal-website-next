"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import BlackHole from "@/components/BlackHole";
import Guestbook from "./Guestbook";
import ArticlesPanel from "@/components/ArticlesPanel";

const PAGES = [
  { id: "home", label: "首页" },
  { id: "profile", label: "个人" },
  { id: "or", label: "项目" },
  { id: "ly", label: "文章" },
  { id: "cy", label: "联系" },
];

const CORNERS = [
  { cls: "le", page: "profile", title: "狮子座 · 个人" },
  { cls: "or", page: "or",   title: "猎户座 · 项目" },
  { cls: "ly", page: "ly",   title: "天琴座 · 文章" },
  { cls: "cy", page: "cy",   title: "天鹅座 · 联系" },
];

export default function Home() {
  const [current, setCurrent] = useState(null);
  const [showCfg, setShowCfg] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [attract, setAttract] = useState(0.45);
  const [userStatus, setUserStatus] = useState("");
  const [statusColor, setStatusColor] = useState("#4f4");
  const [bhMode, setBhMode] = useState(1); // 0=classic 1=ray-traced
  const bhRef = useRef(null);
  const isDesktop = typeof window !== "undefined" ? window.innerWidth >= 1024 : true;

  // 把设置直接写到 ref 对象上（动画循环读 selfRef.current）
  useEffect(() => {
    if (bhRef.current) {
      bhRef.current.speed = speed;
      bhRef.current.attract = attract;
      bhRef.current.bhMode = bhMode;
    }
  }, [speed, attract, bhMode]);

  // 加载个人状态（300ms debounce，防快速切换面板触发大量请求）
  useEffect(() => {
    const timer = setTimeout(() => {
      Promise.all([
        fetch("/api/settings?key=status").then((r) => r.json()),
        fetch("/api/settings?key=statusColor").then((r) => r.json()),
      ])
        .then(([s, c]) => {
          setUserStatus(s.value || "");
          setStatusColor(c.value || "#4f4");
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [current]);

  const show = useCallback((id) => {
    if (current === id) return setCurrent(null);
    setCurrent(id);
  }, [current]);

  const hide = useCallback(() => setCurrent(null), []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") hide(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hide]);

  return (
    <>
      <BlackHole ref={bhRef} />

      <nav>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="brand">✦ 我的空间</span>

          {/* 黑洞控制 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 黑洞模式切换 */}
          <button
            onClick={() => {
              if (bhMode === 0 && !isDesktop) {
                if (!confirm("⚠ 你的设备配置较低，切换到光线追踪模式可能会卡顿。确定切换吗？")) return;
              }
              setBhMode(bhMode === 1 ? 0 : 1);
            }}
            title={bhMode === 1 ? "当前：光线追踪（参考屏保）" : "当前：经典版（原版效果）"}
            style={{
              padding: "3px 10px",
              fontSize: "0.7rem",
              color: bhMode === 1 ? "rgba(180,220,255,0.85)" : "rgba(255,255,255,0.45)",
              background: bhMode === 1 ? "rgba(100,160,255,0.15)" : "rgba(255,255,255,0.05)",
              border: bhMode === 1 ? "1px solid rgba(140,180,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            {bhMode === 1 ? "✦ 光线追踪" : "◇ 经典版"}
          </button>
          {!showCfg ? (
            <button
              onClick={() => setShowCfg(true)}
              style={{
                padding: "3px 12px",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              控制黑洞
            </button>
          ) : (
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
                速度
                <input
                  type="range"
                  min="20"
                  max="160"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  style={{ width: 80, accentColor: "rgba(140,180,255,0.8)" }}
                />
                <span style={{ minWidth: 28, textAlign: "right", color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}>{speed}</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
                吸附
                <input
                  type="range"
                  min="15"
                  max="65"
                  value={Math.round(attract * 100)}
                  onChange={(e) => setAttract(Number(e.target.value) / 100)}
                  style={{ width: 80, accentColor: "rgba(140,180,255,0.8)" }}
                />
                <span style={{ minWidth: 28, textAlign: "right", color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}>{Math.round(attract * 100)}%</span>
              </label>
              <button
                onClick={() => setShowCfg(false)}
                style={{
                  padding: "2px 8px",
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.35)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                x
              </button>
            </>
          )}
          </div>
        </div>

        <div className="links">
          {PAGES.map((p) => (
            <a key={p.id} onClick={() => (p.id === "home" ? hide() : show(p.id))}>
              {p.label}
            </a>
          ))}
        </div>
      </nav>

      {CORNERS.map((cz) => (
        <div key={cz.cls} className={`cz ${cz.cls}`} title={cz.title} onClick={() => show(cz.page)} />
      ))}

      <div className={"panel" + (current === "profile" ? " on" : "")} id="pn-profile">
        <button className="close" onClick={hide}>&times;</button>
        <div className="pn-home-layout" style={{ marginTop: 40 }}>
          <div className="left">
            <img src="/cat.jpg" alt="avatar" className="avatar-img" />
            <div style={{ fontSize: "1rem", color: "rgba(255,255,255,.85)", fontWeight: 500 }}>gch / 残留v枫楪</div>
            <div className="status" id="user-status">
              <span className="status-dot" style={{ background: userStatus ? statusColor : "#f44" }} />
              {userStatus || "加载中..."}
            </div>
            <div className="profile-tags">
              <span>AI agent</span><span>个人博客</span><span>喵～</span><span>大数据专业</span><span>CS</span><span>MC</span>
            </div>
          </div>
          <div className="right">
            <h2>个人简介</h2>
            <div className="bio">一个喜欢猫、也有想法的人，欢迎来到我的个人空间，这里记录了我的项目、文章和想法。本网站采用 Next.js + Three.js + GLSL 构建，黑洞引力透镜与星座星图均为实时渲染。</div>
            <div className="profile-links">
              如果你对网站中的项目、文章、想法、甚至对此网站的设计感兴趣，欢迎一起交流分享，也欢迎大家在网站留言，这片星空将会留下属于你的足迹：
              <br /><br />
              Bilibili：<a href="https://space.bilibili.com/280596044" target="_blank" rel="noopener">space.bilibili.com/280596044</a>
              <br />
              Github：<a href="https://github.com/Residualcanliu" target="_blank" rel="noopener">github.com/Residualcanliu</a>
              <br />
              Steam：<a href="https://steamcommunity.com/profiles/76561198867504448/" target="_blank" rel="noopener">steamcommunity.com/profiles/76561198867504448/</a>
              <br />
              Email：<a href="mailto:gaochaohongmain@foxmail.com">gaochaohongmain@foxmail.com</a>
            </div>
          </div>
        </div>
        <Guestbook onBack={hide} />
      </div>

      <div className={"panel" + (current === "or" ? " on" : "")} id="pn-or">
        <button className="close" onClick={hide}>&times;</button>
        <span>🗡 猎户座 · 项目</span>
        <a className="home-btn" onClick={hide}>← 返回主页</a>
      </div>

      <div className={"panel" + (current === "ly" ? " on" : "")} id="pn-ly">
        <button className="close" onClick={hide}>&times;</button>
        <ArticlesPanel userStatus={userStatus} statusColor={statusColor} onBack={hide} />
      </div>

      <div className={"panel" + (current === "cy" ? " on" : "")} id="pn-cy">
        <button className="close" onClick={hide}>&times;</button>
        <span>🦢 天鹅座 · 联系</span>
        <a className="home-btn" onClick={hide}>← 返回主页</a>
      </div>

      <div className={"panel" + (current === "home" ? " on" : "")} id="pn-home">
        <button className="close" onClick={hide}>&times;</button>
        <div className="pn-home-layout">
          <div className="left">
            <div className="avatar">🌌</div>
            <div style={{ fontSize: ".95rem", color: "rgba(255,255,255,.7)" }}>gch</div>
            <div className="status">🟢 探索宇宙中</div>
          </div>
          <div className="right">
            <h2>✦ 我的空间</h2>
            <div className="bio">欢迎来到我的个人网站。这里记录了我的项目、文章和想法。黑洞在中心旋转，像引力一样把一切连接在一起。</div>
            <div className="tags"><span>Three.js</span><span>GLSL</span><span>WebGL</span><span>个人博客</span></div>
          </div>
        </div>
        <a className="home-btn" onClick={hide}>← 返回主页</a>
      </div>

      <div className="hint" id="hint">
        made by gch / 残留v枫楪
        <br />
        <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>建议用电脑打开，效果更佳</span>
      </div>
    </>
  );
}
