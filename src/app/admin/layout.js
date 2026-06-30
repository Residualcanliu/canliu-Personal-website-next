"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "首页" },
  { href: "/admin/analytics", label: "访问统计" },
  { href: "/admin/articles", label: "文章管理" },
  { href: "/admin/projects", label: "项目管理" },
  { href: "/admin/music", label: "音乐管理" },
  { href: "/admin/messages", label: "留言管理" },
  { href: "/admin/comments", label: "评论管理" },
  { href: "/admin/pegasus", label: "天马座存档" },
  { href: "/admin/settings", label: "设置" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#13132a",
        color: "#fff",
        fontFamily: '"PingFang SC","Microsoft YaHei",system-ui,sans-serif',
      }}
    >
      {/* ── 左侧导航栏 ── */}
      <aside
        style={{
          width: 210,
          flexShrink: 0,
          background: "rgba(8,8,24,0.85)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "0 20px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            marginBottom: 8,
          }}
        >
          <Link
            href="/admin"
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            管理后台
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "8px 10px", position: "static", display: "block", height: "auto", background: "none", border: "none", backdropFilter: "none" }}>
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  marginBottom: 2,
                  fontSize: "0.88rem",
                  color: active
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.45)",
                  background: active
                    ? "rgba(100,140,255,0.12)"
                    : "transparent",
                  borderRadius: 7,
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 返回首页 */}
        <div style={{ padding: "0 10px", marginTop: "auto" }}>
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.35)",
              textDecoration: "none",
              borderRadius: 7,
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "rgba(255,255,255,0.7)";
              e.target.style.background = "rgba(255,255,255,0.04)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "rgba(255,255,255,0.35)";
              e.target.style.background = "transparent";
            }}
          >
            &larr; 返回首页
          </a>
        </div>

        {/* 底部用户区 */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              width: "100%",
              padding: "8px 0",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.4)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.color = "rgba(255,255,255,0.7)")
            }
            onMouseLeave={(e) =>
              (e.target.style.color = "rgba(255,255,255,0.4)")
            }
          >
            ← 退出登录
          </button>
        </div>
      </aside>

      {/* ── 右侧内容区 ── */}
      <main style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
