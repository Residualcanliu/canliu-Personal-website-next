export default function AnalyticsPage() {
  return (
    <div style={{ padding: "36px 32px", maxWidth: 960 }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 500, marginBottom: 6 }}>
        📈 访问统计
      </h2>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginBottom: 32 }}>
        折线图 + 热力图将在下一版迭代中接入。
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
        📊 图表组件开发中，敬请期待
      </div>
    </div>
  );
}
