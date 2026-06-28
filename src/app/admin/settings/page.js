export default function SettingsPage() {
  return (
    <div style={{ padding: "36px 32px", maxWidth: 960 }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 500, marginBottom: 6 }}>
        ⚙ 设置
      </h2>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginBottom: 32 }}>
        网站基础配置、个人信息、SEO 等。
      </p>
      <div
        style={{
          padding: 60,
          textAlign: "center",
          background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.08)",
          borderRadius: 12,
          color: "rgba(255,255,255,0.25)",
          fontSize: "0.9rem",
        }}
      >
        ⚙ 设置模块开发中，敬请期待
      </div>
    </div>
  );
}
