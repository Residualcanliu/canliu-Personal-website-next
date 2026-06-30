"use client";

export default function MusicPlayer({ onBack, songs, songIdx, playing, musicCtrl }) {
  const current = songIdx >= 0 ? songs[songIdx] : null;

  const handleClick = (idx) => {
    if (idx === songIdx) { musicCtrl.toggle(); }
    else { musicCtrl.play(idx); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "min(90vw, 500px)", maxHeight: "70vh", color: "#fff" }}>
      {current && (
        <div style={{
          textAlign: "center", padding: "16px 0 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 12,
        }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px",
            background: "radial-gradient(circle at 40% 40%, rgba(180,200,240,0.4), rgba(80,100,180,0.15))",
            animation: playing ? "spin 4s linear infinite" : "none",
          }} />
          <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 2 }}>{current.title}</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{current.artist || "未知歌手"}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 12 }}>
            <button onClick={musicCtrl.prev} style={cBtn} title="上一首"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
            <button onClick={musicCtrl.toggle} style={{ ...cBtn, width: 40, height: 40 }} title={playing ? "暂停" : "播放"}>
              {playing ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <button onClick={musicCtrl.next} style={cBtn} title="下一首"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12z"/><rect x="16" y="6" width="2" height="12"/></svg></button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {songs.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 20 }}>还没有歌曲，敬请期待</p>
        ) : (
          songs.map((s, i) => (
            <div key={s.id}
              onClick={() => handleClick(i)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                borderRadius: 8, cursor: "pointer", marginBottom: 4,
                background: i === songIdx ? "rgba(100,160,240,0.12)" : "transparent",
                border: i === songIdx ? "1px solid rgba(100,160,240,0.2)" : "1px solid transparent",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => { if (i !== songIdx) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={e => { if (i !== songIdx) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", width: 20, textAlign: "center" }}>
                {i === songIdx && playing ? "~" : i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: i === songIdx ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.title}
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{s.artist || ""}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <a onClick={onBack} style={{ textAlign: "center", marginTop: 14, fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", cursor: "pointer", textDecoration: "none" }}>
        ← 返回主页
      </a>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const cBtn = {
  width: 32, height: 32, borderRadius: "50%",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
