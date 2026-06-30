"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const error = params.get("error");
  const [showCred, setShowCred] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredLogin = async (e) => {
    e.preventDefault();
    setLoginErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/credential-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = await res.json();
        setLoginErr(d.error || "登录失败");
        return;
      }
      router.push("/admin");
    } catch {
      setLoginErr("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#13132a",
        color: "#fff",
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        gap: "24px",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", fontWeight: 500 }}>管理员登录</h1>

      {error && (
        <p
          style={{
            color: "rgba(255,120,120,0.9)",
            background: "rgba(255,0,0,0.08)",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: "0.9rem",
          }}
        >
          {error === "unauthorized"
            ? "此 GitHub 账号未被授权登录管理后台"
            : `登录失败 [${error}]，请检查 GitHub OAuth App 配置或联系管理员`}
        </p>
      )}

      {loginErr && (
        <p style={{ color: "rgba(255,120,120,0.9)", fontSize: "0.85rem" }}>{loginErr}</p>
      )}

      <button
        onClick={() => signIn("github", { callbackUrl: "/admin" })}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 28px",
          fontSize: "1rem",
          color: "#fff",
          background: "#24292e",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8,
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        Login with GitHub
      </button>

      {/* 隐藏的账号密码登录入口 */}
      {!showCred ? (
        <p
          onClick={() => setShowCred(true)}
          style={{
            color: "rgba(255,255,255,0.12)",
            fontSize: "0.8rem",
            cursor: "default",
            userSelect: "none",
          }}
          title=""
        >
          仅限管理员账号登录
        </p>
      ) : (
        <form
          onSubmit={handleCredLogin}
          style={{
            display: "flex", flexDirection: "column", gap: 12,
            width: 260, padding: 20,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
          }}
        >
          <input
            value={username} onChange={e => setUsername(e.target.value)}
            placeholder="账号" autoFocus
            style={{
              padding: "8px 12px", fontSize: "0.9rem",
              color: "#e5e7eb", background: "#111827",
              border: "1px solid #374151", borderRadius: 6, outline: "none",
            }}
          />
          <input
            type="password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="密码"
            style={{
              padding: "8px 12px", fontSize: "0.9rem",
              color: "#e5e7eb", background: "#111827",
              border: "1px solid #374151", borderRadius: 6, outline: "none",
            }}
          />
          <button
            type="submit" disabled={loading}
            style={{
              padding: "8px 0", fontSize: "0.9rem",
              color: "#fff", background: "#3b82f6", border: "none", borderRadius: 6,
              cursor: "pointer", opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#13132a",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
