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
  const [attract, setAttract] = useState(0.20);
  const [preset, setPreset] = useState(0); // 默认 Inferno 烈焰
  const [showParams, setShowParams] = useState(false);
  const [cust, setCust] = useState({
    temp:5500, incl:1.50, roll:2.7, inner:1.8, outer:8.0,
    opac:0.90, dopp:0.60, beam:2.5, gain:2.2, contr:1.6,
    wind:7.0, speed:5.0, expo:1.40, star:0.0
  });
  const [userStatus, setUserStatus] = useState("");
  const [statusColor, setStatusColor] = useState("#4f4");
  const bhRef = useRef(null);

  // 预设名称（对应 BlackHole.jsx PRESETS）
  const PRESET_NAMES = [
    "Inferno — 烈焰", "Gargantua — 巨浪", "M87* Donut — 甜甜圈",
    "Face-on Ember — 余烬", "Quasar — 类星体", "Blazar — 耀变体",
    "Pure Lens — 纯透镜", "Inferno (复现)"
  ];

  // 把设置直接写到 ref 对象上
  useEffect(() => {
    if (bhRef.current) {
      bhRef.current.speed = speed;
      bhRef.current.attract = attract;
      bhRef.current.preset = preset;
      if (preset < 0) bhRef.current.customParams = cust;
    }
  }, [speed, attract, preset, cust]);

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

          {/* 黑洞参数 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!showCfg ? (
            <button
              onClick={() => setShowCfg(true)}
              style={{
                padding: "3px 12px", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 5, cursor: "pointer",
              }}
            >黑洞参数</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4,
              background: "rgba(10,10,20,0.94)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "8px 12px", position: "absolute", top: 48, left: 0,
              zIndex: 200, maxHeight: "75vh", overflowY: "auto", minWidth: 380 }}>
              {/* Row 1: 预设 + 基础 */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <select value={preset} onChange={(e) => setPreset(Number(e.target.value))}
                  style={{ padding: "2px 6px", fontSize: "0.72rem", color: "rgba(255,255,255,0.8)",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 4, cursor: "pointer", maxWidth: 160 }}>
                  <option value={-1} style={{ background: "#1a1a2e", color: "#e8a840" }}>自定义</option>
                  {PRESET_NAMES.map((n, i) => (
                    <option key={i} value={i} style={{ background: "#1a1a2e", color: "#ccc" }}>{n}</option>
                  ))}
                </select>
                <label style={{ display:"flex",alignItems:"center",gap:4,fontSize:"0.7rem",color:"rgba(255,255,255,0.6)",whiteSpace:"nowrap" }}>
                  速度<input type="range" min="20" max="160" value={speed}
                  onChange={e => setSpeed(+e.target.value)} style={{ width:55,accentColor:"rgba(140,180,255,0.8)" }} />
                  <span style={{ minWidth:22,textAlign:"right",color:"rgba(255,255,255,0.4)",fontSize:"0.6rem" }}>{speed}</span></label>
                <label style={{ display:"flex",alignItems:"center",gap:4,fontSize:"0.7rem",color:"rgba(255,255,255,0.6)",whiteSpace:"nowrap" }}>
                  吸附<input type="range" min="15" max="65" value={Math.round(attract*100)}
                  onChange={e => setAttract(+e.target.value/100)} style={{ width:55,accentColor:"rgba(140,180,255,0.8)" }} />
                  <span style={{ minWidth:26,textAlign:"right",color:"rgba(255,255,255,0.4)",fontSize:"0.6rem" }}>{Math.round(attract*100)}%</span></label>
                <button onClick={() => setShowParams(!showParams)}
                  style={{ padding: "2px 8px", fontSize: "0.65rem",
                    color: showParams ? "rgba(180,210,255,0.85)" : "rgba(255,255,255,0.3)",
                    background: showParams ? "rgba(100,160,255,0.12)" : "rgba(255,255,255,0.03)",
                    border: showParams ? "1px solid rgba(140,180,255,0.25)" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 4, cursor: "pointer" }}>⚙ 参数</button>
                <button onClick={() => setShowCfg(false)}
                  style={{ padding: "2px 6px", fontSize: "0.7rem", color: "rgba(255,255,255,0.35)",
                    background: "none", border: "none", cursor: "pointer", marginLeft: "auto" }}>x</button>
              </div>
              {/* Row 2+: 参数滑块 */}
              {showParams && (
                <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {[
                    ["色温 K", "temp", 2000, 30000, 1, v => Math.round(v)+"K", null],
                    ["倾角 rad", "incl", 0, 1.57, 0.01, v => v.toFixed(2), null],
                    ["旋转 rad", "roll", -3, 3, 0.01, v => v.toFixed(2), null],
                    ["内半径 rₛ", "inner", 1.6, 10, 0.1, v => v.toFixed(1), null],
                    ["外半径 rₛ", "outer", 3, 30, 0.5, v => v.toFixed(1), null],
                  ].map(([label, key, min, max, step, fmt]) => (
                    <label key={key} style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ minWidth: 70, fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>{label}</span>
                      <input type="range" min={min} max={max} step={step} value={cust[key]}
                        onChange={e => { setPreset(-1); setCust(prev => ({...prev, [key]: +e.target.value})); }}
                        style={{ flex: 1, minWidth: 80, accentColor: "rgba(140,180,255,0.8)", height: 12 }} />
                      <span style={{ minWidth: 50, textAlign: "right", fontSize: "0.65rem", color: "rgba(255,255,255,0.45)" }}>{fmt(cust[key])}</span>
                    </label>
                  ))}
                  {[
                    ["不透明度", "opac", 0, 1, 0.01, v => v.toFixed(2)],
                    ["Doppler 混合", "dopp", 0, 1, 0.01, v => v.toFixed(2)],
                    ["Beaming 指数", "beam", 0, 6, 0.1, v => v.toFixed(1)],
                    ["亮度增益", "gain", 0, 4, 0.05, v => v.toFixed(2)],
                    ["条纹对比度", "contr", 0, 3, 0.05, v => v.toFixed(2)],
                  ].map(([label, key, min, max, step, fmt]) => (
                    <label key={key} style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ minWidth: 70, fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>{label}</span>
                      <input type="range" min={min} max={max} step={step} value={cust[key]}
                        onChange={e => { setPreset(-1); setCust(prev => ({...prev, [key]: +e.target.value})); }}
                        style={{ flex: 1, minWidth: 80, accentColor: "rgba(140,180,255,0.8)", height: 12 }} />
                      <span style={{ minWidth: 40, textAlign: "right", fontSize: "0.65rem", color: "rgba(255,255,255,0.45)" }}>{fmt(cust[key])}</span>
                    </label>
                  ))}
                  {[
                    ["缠绕紧度", "wind", 1, 15, 0.1, v => v.toFixed(1)],
                    ["旋转速度", "speed", -15, 15, 0.1, v => v.toFixed(1)],
                    ["曝光度", "expo", 0.1, 5, 0.05, v => v.toFixed(2)],
                  ].map(([label, key, min, max, step, fmt]) => (
                    <label key={key} style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ minWidth: 70, fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>{label}</span>
                      <input type="range" min={min} max={max} step={step} value={cust[key]}
                        onChange={e => { setPreset(-1); setCust(prev => ({...prev, [key]: +e.target.value})); }}
                        style={{ flex: 1, minWidth: 80, accentColor: "rgba(140,180,255,0.8)", height: 12 }} />
                      <span style={{ minWidth: 40, textAlign: "right", fontSize: "0.65rem", color: "rgba(255,255,255,0.45)" }}>{fmt(cust[key])}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
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
            <div className="bio">一个喜欢猫、也有想法的人，欢迎来到我的个人空间，这里记录了我的项目、文章和想法。本网站采用 Next.js + WebGL 2 构建，黑洞基于 ghostty-blackhole (XboxNahida) 的 Schwarzschild 光线追踪着色器，实现引力透镜、吸积盘、光子环等相对论效应实时渲染。</div>
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
              <br /><br />
              黑洞效果参考：<a href="https://github.com/XboxNahida/ghostty-blackhole-main" target="_blank" rel="noopener">github.com/XboxNahida/ghostty-blackhole-main</a>
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
            <div className="tags"><span>WebGL 2</span><span>Schwarzschild 光线追踪</span><span>GLSL</span><span>个人博客</span></div>
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
