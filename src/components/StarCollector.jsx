"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export default function StarCollector({ onBack }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const loopRef = useRef(null);
  const menuRef = useRef(null);
  const countdownRef = useRef(0);
  const [mode, setMode] = useState(null);     // null=选择画面, "timed"=计时, "lives"=生命

  const startGame = useCallback((gameMode) => {
    countdownRef.current = 3;
    setMode(gameMode);
  }, []);

  const backToMenu = useCallback(() => {
    countdownRef.current = 0;
    setMode(null);
  }, []);
  useEffect(() => { menuRef.current = backToMenu; }, [backToMenu]);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = () => canvas.width = window.innerWidth;
    const H = () => canvas.height = window.innerHeight;
    W(); H();
    const resize = () => { W(); H(); };

    const bgStars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.5 + 0.2, tw: Math.random() * Math.PI * 2,
    }));

    const BASKET_W = 130, BASKET_H = 30;

    // ── 音效（Web Audio API 合成）──
    let audioCtx = null;
    const getAudioCtx = () => {
      if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
      if (audioCtx?.state === "suspended") audioCtx.resume();
      return audioCtx;
    };
    const playSfx = (freq, type, dur, vol, glide) => {
      const ac = getAudioCtx();
      if (!ac) return;
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (glide) osc.frequency.linearRampToValueAtTime(freq * glide, t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(t); osc.stop(t + dur);
    };
    const sfxStar = () => { playSfx(880, "sine", 0.12, 0.18, 1.3); };
    const sfxBlue = () => { playSfx(660, "sine", 0.2, 0.22, 1.6); setTimeout(() => playSfx(1100, "sine", 0.15, 0.14, 1.2), 80); };
    const sfxBomb = () => { playSfx(100, "sawtooth", 0.25, 0.2, 0.5); };

    const s = {
      mode, score: 0, lives: 3, timeLeft: 60, gameOver: false, paused: false,
      countdown: countdownRef.current,
      basketX: window.innerWidth / 2,
      items: [],
      spawnTimer: 0, spawnGap: 85,
      speedMul: 0.5,
      keys: {},
      high: 0,
      comboFlash: 0,
      startTime: performance.now(),
    };
    try { s.high = parseInt(localStorage.getItem("starCollectorHigh") || "0", 10) || 0; } catch { s.high = 0; }
    stateRef.current = s;

    // 倒计时计时器
    const cdTimer = s.countdown > 0 ? setInterval(() => {
      s.countdown--;
      countdownRef.current = s.countdown;
      if (s.countdown <= 0) clearInterval(cdTimer);
    }, 800) : null;

    const onKeyDown = (e) => { s.keys[e.key] = true; };
    const onKeyUp = (e) => { s.keys[e.key] = false; };

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function spawnItem() {
      const types = ["star", "star", "star", "star", "star", "bstar", "bstar", "bomb"];
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        x: 30 + Math.random() * (window.innerWidth - 60),
        y: -20,
        type,
        vy: (1.5 + Math.random() * 1.8) * s.speedMul,
        r: type === "bomb" ? 17 : type === "bstar" ? 15 : 19,
        glow: Math.random() * 0.4 + 0.6,
      };
    }

    function drawBasket(x) {
      const cx = Math.max(BASKET_W / 2, Math.min(window.innerWidth - BASKET_W / 2, x));
      const top = window.innerHeight - 80;
      const grd = ctx.createRadialGradient(cx, top + BASKET_H / 2, BASKET_W * 0.1, cx, top + BASKET_H / 2, BASKET_W * 0.7);
      grd.addColorStop(0, "rgba(140,180,255,0.25)");
      grd.addColorStop(0.5, "rgba(100,140,220,0.08)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(cx - BASKET_W * 0.7, top - 10, BASKET_W * 1.4, BASKET_H + 20);
      ctx.strokeStyle = "rgba(180,210,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - BASKET_W / 2, top);
      ctx.quadraticCurveTo(cx - BASKET_W / 2, top + BASKET_H + 6, cx, top + BASKET_H + 6);
      ctx.quadraticCurveTo(cx + BASKET_W / 2, top + BASKET_H + 6, cx + BASKET_W / 2, top);
      ctx.stroke();
      const bg = ctx.createLinearGradient(cx, top, cx, top + BASKET_H + 6);
      bg.addColorStop(0, "rgba(120,160,240,0.18)");
      bg.addColorStop(1, "rgba(60,100,200,0.04)");
      ctx.fillStyle = bg;
      ctx.fill();
    }

    function drawItem(it) {
      ctx.save();
      const glowColor = it.type === "bomb" ? "255,80,80" : it.type === "bstar" ? "100,180,255" : "240,200,100";
      ctx.shadowColor = `rgba(${glowColor},${it.glow})`;
      ctx.shadowBlur = it.r * 1.5;
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = `rgba(${glowColor},0.5)`;
      ctx.beginPath();
      ctx.arc(it.x, it.y - 4, it.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      const bodyGrd = ctx.createRadialGradient(it.x - it.r * 0.2, it.y - it.r * 0.2, it.r * 0.05, it.x, it.y, it.r);
      if (it.type === "bomb") {
        bodyGrd.addColorStop(0, "rgba(255,160,160,0.9)");
        bodyGrd.addColorStop(0.6, "rgba(200,50,50,0.7)");
        bodyGrd.addColorStop(1, "rgba(120,20,20,0.2)");
      } else if (it.type === "bstar") {
        bodyGrd.addColorStop(0, "rgba(180,220,255,0.95)");
        bodyGrd.addColorStop(0.5, "rgba(80,150,240,0.7)");
        bodyGrd.addColorStop(1, "rgba(30,80,180,0.15)");
      } else {
        bodyGrd.addColorStop(0, "rgba(255,240,180,0.95)");
        bodyGrd.addColorStop(0.5, "rgba(240,180,40,0.7)");
        bodyGrd.addColorStop(1, "rgba(180,100,20,0.15)");
      }
      ctx.fillStyle = bodyGrd;
      ctx.beginPath();
      if (it.type === "bomb") {
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
      } else {
        const spikes = 4, outerR = it.r, innerR = it.r * 0.4;
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (Math.PI * 2 * i) / (spikes * 2) - Math.PI / 2;
          const px = it.x + Math.cos(angle) * r;
          const py = it.y + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }

    function checkHit(it) {
      const bx = Math.max(BASKET_W / 2, Math.min(window.innerWidth - BASKET_W / 2, s.basketX));
      const by = window.innerHeight - 80 + BASKET_H / 2;
      const dx = it.x - bx, dy = it.y - by;
      return Math.sqrt(dx * dx + dy * dy) < BASKET_W * 0.55;
    }

    function loop() {
      loopRef.current = loop;
      if (stateRef.current !== s) return;
      if (s.paused) { requestAnimationFrame(loop); return; }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      const now = performance.now() / 1000;
      for (const bs of bgStars) {
        const flicker = 0.5 + 0.5 * Math.sin(now * 1.5 + bs.tw);
        ctx.fillStyle = `rgba(180,200,240,${bs.a * flicker})`;
        ctx.beginPath();
        ctx.arc(bs.x * window.innerWidth, bs.y * window.innerHeight, bs.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 开场倒计时
      if (s.countdown > 0) {
        ctx.textAlign = "center";
        const pulse = 1 + (1 - (s.countdown % 1)) * 0.3;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = `600 ${80 * pulse}px "PingFang SC","Microsoft YaHei UI",sans-serif`;
        ctx.fillText(String(Math.ceil(s.countdown)), window.innerWidth / 2, window.innerHeight / 2 + 16);
        requestAnimationFrame(loop);
        return;
      }

      if (s.gameOver) {
        const finalScore = s.score;
        if (finalScore > s.high) { s.high = finalScore; try { localStorage.setItem("starCollectorHigh", String(s.high)); } catch {} }
        ctx.fillStyle = "rgba(2,2,16,0.7)";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "600 36px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText("游戏结束", window.innerWidth / 2, window.innerHeight / 2 - 60);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "400 20px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText("得分: " + finalScore + "    最高: " + s.high, window.innerWidth / 2, window.innerHeight / 2 - 10);
        ctx.fillStyle = "rgba(180,210,255,0.7)";
        ctx.font = "400 16px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText("点击任意位置返回菜单", window.innerWidth / 2, window.innerHeight / 2 + 30);

        const goMenu = () => {
          canvas.removeEventListener("click", goMenu);
          menuRef.current?.();
        };
        canvas.addEventListener("click", goMenu);
        requestAnimationFrame(loop);
        return;
      }

      const kx = (s.keys["ArrowLeft"] || s.keys["a"] || s.keys["A"]) ? -14
        : (s.keys["ArrowRight"] || s.keys["d"] || s.keys["D"]) ? 14 : 0;
      if (kx) s.basketX += kx;

      // 计时模式：倒计时
      if (s.mode === "timed") {
        const elapsed = (performance.now() - s.startTime) / 1000;
        s.timeLeft = Math.max(0, 60 - elapsed);
        if (s.timeLeft <= 0) s.gameOver = true;
      }

      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnGap) { s.spawnTimer = 0; s.items.push(spawnItem()); }

      for (let i = s.items.length - 1; i >= 0; i--) {
        const it = s.items[i];
        it.y += it.vy;
        drawItem(it);
        if (checkHit(it)) {
          if (it.type === "bomb") {
            sfxBomb();
            if (s.mode === "lives") { s.lives--; if (s.lives <= 0) s.gameOver = true; }
            else { s.score = Math.max(0, s.score - 3); }
            s.comboFlash = 12;
          } else {
            if (it.type === "bstar") sfxBlue(); else sfxStar();
            s.score += it.type === "bstar" ? 3 : 1;
            s.comboFlash = 8;
            s.speedMul = 0.5 + Math.floor(Math.max(0, s.score) / 12) * 0.2;
            s.spawnGap = Math.max(35, 85 - Math.floor(Math.max(0, s.score) / 12) * 4);
          }
          s.items.splice(i, 1);
          continue;
        }
        if (it.y > window.innerHeight + 30) {
          if (it.type !== "bomb" && s.mode === "lives") { s.lives--; if (s.lives <= 0) s.gameOver = true; }
          s.items.splice(i, 1);
        }
      }

      drawBasket(s.basketX);
      if (s.comboFlash > 0) {
        s.comboFlash--;
        const bx = Math.max(BASKET_W / 2, Math.min(window.innerWidth - BASKET_W / 2, s.basketX));
        const by = window.innerHeight - 80 + BASKET_H / 2;
        ctx.fillStyle = `rgba(200,220,255,${s.comboFlash / 12 * 0.3})`;
        ctx.beginPath();
        ctx.arc(bx, by, BASKET_W * 0.4 + (12 - s.comboFlash) * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // HUD
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "400 13px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      ctx.fillText("分数", window.innerWidth / 2, 34);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "600 40px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      ctx.fillText(s.score, window.innerWidth / 2, 72);
      ctx.font = "400 16px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      if (s.mode === "timed") {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillText("时间", window.innerWidth / 2, 108);
        ctx.fillStyle = s.timeLeft <= 10 ? "rgba(255,100,100,0.9)" : "rgba(255,255,255,0.55)";
        ctx.fillText(s.timeLeft.toFixed(1) + "s", window.innerWidth / 2, 126);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillText("生命", window.innerWidth / 2, 108);
        ctx.fillStyle = s.lives <= 1 ? "rgba(255,100,100,0.9)" : "rgba(255,255,255,0.55)";
        ctx.fillText("o".repeat(Math.max(0, s.lives)), window.innerWidth / 2, 126);
      }
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.font = "400 12px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      ctx.fillText("最高: " + s.high, window.innerWidth / 2, 150);
      ctx.fillText("按 A/D 或 ← → 键移动篮子", window.innerWidth / 2, window.innerHeight - 24);
      ctx.textAlign = "left";

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
      if (cdTimer) clearInterval(cdTimer);
      if (audioCtx) { audioCtx.close(); audioCtx = null; }
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      s.paused = true;
    };
  }, [mode]);

  useEffect(() => {
    if (mode === null) return;
    const cleanup = init();
    return () => { if (cleanup) cleanup(); };
  }, [mode, init]);

  // 模式选择画面
  if (mode === null) {
    return (
      <div style={{
        width: "100vw", height: "100vh", background: "#050510",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "#fff", fontFamily: "\"PingFang SC\",\"Microsoft YaHei UI\",sans-serif",
      }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 600, marginBottom: 8,
          textShadow: "0 0 40px rgba(140,190,250,0.4)" }}>
          人马座 · 星点收集
        </div>
        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.35)", marginBottom: 28 }}>
          按 A/D 或 ← → 键移动篮子，接住下落星星
        </div>

        {/* 物品说明 */}
        <div style={{ display: "flex", gap: 28, marginBottom: 40, fontSize: "0.78rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#e8b830", fontSize: "1.2rem" }}>*</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>金色星 +1</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#60b0f0", fontSize: "1.2rem" }}>*</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>蓝色星 +3</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#f05050", fontSize: "1.2rem" }}>o</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>炸弹 -3 / -1命</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 280 }}>
          <button onClick={() => startGame("timed")} style={modeBtn}>
            <div style={{ fontSize: "1.1rem", fontWeight: 500 }}>计时模式 — 60 秒</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>限时得分，接炸弹扣分，漏接不扣分</div>
          </button>
          <button onClick={() => startGame("lives")} style={modeBtn}>
            <div style={{ fontSize: "1.1rem", fontWeight: 500 }}>生命模式 — 3 条命</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>漏接或接炸弹扣命，坚持越久分数越高</div>
          </button>
        </div>

        <a onClick={onBack} style={{
          marginTop: 40, fontSize: "0.82rem", color: "rgba(255,255,255,0.3)",
          cursor: "pointer", textDecoration: "none",
        }}>← 返回主页</a>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", position: "fixed", inset: 0 }}
    />
  );
}

const modeBtn = {
  width: "100%", padding: "18px 24px", textAlign: "left",
  color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer",
  transition: "background 0.2s, border-color 0.2s",
};
