"use client";

import { useState, useCallback, useEffect } from "react";
import BlackHole from "@/components/BlackHole";

const PAGES = [
  { id: "home", label: "首页" },
  { id: "profile", label: "个人" },
  { id: "or", label: "项目" },
  { id: "ly", label: "文章" },
  { id: "cy", label: "联系" },
];

const CORNERS = [
  { cls: "ly", page: "profile", title: "狮子座 · 个人" },
  { cls: "cy", page: "cy", title: "天鹅座 · 联系" },
  { cls: "le", page: "or", title: "猎户座 · 项目" },
  { cls: "or", page: "ly", title: "天琴座 · 文章" },
];

export default function Home() {
  const [current, setCurrent] = useState(null);

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
      <BlackHole />

      <nav>
        <span className="brand">✦ 我的空间</span>
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
        <span>♌ 狮子座 · 个人</span>
        <a className="home-btn" onClick={hide}>← 返回主页</a>
      </div>

      <div className={"panel" + (current === "or" ? " on" : "")} id="pn-or">
        <button className="close" onClick={hide}>&times;</button>
        <span>🗡 猎户座 · 项目</span>
        <a className="home-btn" onClick={hide}>← 返回主页</a>
      </div>

      <div className={"panel" + (current === "ly" ? " on" : "")} id="pn-ly">
        <button className="close" onClick={hide}>&times;</button>
        <span>♫ 天琴座 · 文章</span>
        <a className="home-btn" onClick={hide}>← 返回主页</a>
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

      <div className="hint" id="hint">made by gch / 残留v枫楪</div>
    </>
  );
}
