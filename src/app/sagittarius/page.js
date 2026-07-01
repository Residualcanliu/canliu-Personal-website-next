"use client";

import { useRouter } from "next/navigation";
import StarCollector from "@/components/StarCollector";

export default function SagittariusPage() {
  const router = useRouter();

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#050510", position: "relative" }}>
      <StarCollector onBack={() => router.push("/")} />
      {/* 返回按钮 */}
      <a
        onClick={() => router.push("/")}
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 20,
          color: "rgba(255,255,255,0.35)", fontSize: "0.82rem",
          cursor: "pointer", textDecoration: "none",
          padding: "6px 14px", borderRadius: 6,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          transition: "color 0.2s, background 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      >
        ← 返回主页
      </a>
    </div>
  );
}
