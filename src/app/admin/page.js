import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div style={{ minHeight: "100vh", background: "#13132a" }}>
      {/* 顶栏 */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          height: 54,
          background: "rgba(4,4,16,0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "1rem" }}>
          ⚙ 管理后台
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
            {session.user.name}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              style={{
                padding: "5px 14px",
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.55)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              退出登录
            </button>
          </form>
        </div>
      </header>

      {/* 内容区 */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 500, marginBottom: 8 }}>
          仪表盘
        </h2>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.88rem", marginBottom: 36 }}>
          欢迎回来，{session.user.name}。后台功能将逐步完善。
        </p>

        {/* 快捷入口 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { label: "文章", value: "管理", hint: "写文章 / 编辑 / 发布", href: "/admin/articles" },
            { label: "今日访问", value: "—", hint: "统计开发中" },
            { label: "总访问量", value: "—", hint: "统计开发中" },
          ].map((c) => {
            const card = (
              <div
                key={c.label}
                style={{
                  padding: "22px 20px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  ...(c.href
                    ? { cursor: "pointer", transition: "background 0.2s" }
                    : {}),
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>
                  {c.label}
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 600, marginTop: 6 }}>
                  {c.value}
                </div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                  {c.hint}
                </div>
              </div>
            );
            return c.href ? (
              <Link key={c.label} href={c.href} style={{ textDecoration: "none", color: "inherit" }}>
                {card}
              </Link>
            ) : (
              card
            );
          })}
        </div>
      </main>
    </div>
  );
}
