"use client";

import { useEffect, useRef, useCallback } from "react";

export default function StarCollector({ onBack }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const loopRef = useRef(null);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = () => canvas.width = window.innerWidth;
    const H = () => canvas.height = window.innerHeight;
    W(); H();
    const resize = () => { W(); H(); };

    // 背景星空
    const bgStars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.5 + 0.2, tw: Math.random() * Math.PI * 2,
    }));

    // 篮子
    const BASKET_W = 90, BASKET_H = 28;

    const s = {
      score: 0, lives: 3, gameOver: false, paused: false,
      basketX: window.innerWidth / 2,
      items: [],        // { x, y, type, vy, glow }
      spawnTimer: 0, spawnGap: 55, // frames between spawns
      speedMul: 1,
      keys: {},
      high: 0,
      comboFlash: 0,    // 接到星星时的闪光帧数
    };
    try { s.high = parseInt(localStorage.getItem("starCollectorHigh") || "0", 10) || 0; } catch { s.high = 0; }
    stateRef.current = s;

    // 输入
    const onMouse = (e) => { s.basketX = e.clientX; };
    const onTouch = (e) => { e.preventDefault(); s.basketX = e.touches[0].clientX; };
    const onKeyDown = (e) => { s.keys[e.key] = true; };
    const onKeyUp = (e) => { s.keys[e.key] = false; };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // 生成下落物
    function spawnItem() {
      const types = ["star", "star", "star", "star", "star", "bstar", "bstar", "bomb"];
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        x: 30 + Math.random() * (window.innerWidth - 60),
        y: -20,
        type,
        vy: (1.5 + Math.random() * 1.8) * s.speedMul,
        r: type === "bomb" ? 10 : type === "bstar" ? 8 : 12,
        glow: Math.random() * 0.4 + 0.6,
      };
    }

    function drawBasket(x) {
      const cx = Math.max(BASKET_W / 2, Math.min(window.innerWidth - BASKET_W / 2, x));
      const top = window.innerHeight - 80;
      // 辉光
      const grd = ctx.createRadialGradient(cx, top + BASKET_H / 2, BASKET_W * 0.1, cx, top + BASKET_H / 2, BASKET_W * 0.7);
      grd.addColorStop(0, "rgba(140,180,255,0.25)");
      grd.addColorStop(0.5, "rgba(100,140,220,0.08)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(cx - BASKET_W * 0.7, top - 10, BASKET_W * 1.4, BASKET_H + 20);
      // 篮子主体
      ctx.strokeStyle = "rgba(180,210,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - BASKET_W / 2, top);
      ctx.quadraticCurveTo(cx - BASKET_W / 2, top + BASKET_H + 6, cx, top + BASKET_H + 6);
      ctx.quadraticCurveTo(cx + BASKET_W / 2, top + BASKET_H + 6, cx + BASKET_W / 2, top);
      ctx.stroke();
      // 填充
      const bg = ctx.createLinearGradient(cx, top, cx, top + BASKET_H + 6);
      bg.addColorStop(0, "rgba(120,160,240,0.18)");
      bg.addColorStop(1, "rgba(60,100,200,0.04)");
      ctx.fillStyle = bg;
      ctx.fill();
    }

    function drawItem(it) {
      ctx.save();
      // 外发光
      const glowColor = it.type === "bomb" ? "255,80,80" : it.type === "bstar" ? "100,180,255" : "240,200,100";
      ctx.shadowColor = `rgba(${glowColor},${it.glow})`;
      ctx.shadowBlur = it.r * 1.5;
      // 拖尾
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = `rgba(${glowColor},0.5)`;
      ctx.beginPath();
      ctx.arc(it.x, it.y - 4, it.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // 主体
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
        // 四角星
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
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < BASKET_W * 0.55;
    }

    function loop() {
      loopRef.current = loop;
      if (stateRef.current !== s) return; // stale
      if (s.gameOver || s.paused) { requestAnimationFrame(loop); return; }

      // 键盘
      const kx = (s.keys["ArrowLeft"] || s.keys["a"] || s.keys["A"]) ? -7
        : (s.keys["ArrowRight"] || s.keys["d"] || s.keys["D"]) ? 7 : 0;
      if (kx) s.basketX += kx;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // 背景
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

      // 生成
      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnGap) { s.spawnTimer = 0; s.items.push(spawnItem()); }

      // 更新 + 绘制下落物
      for (let i = s.items.length - 1; i >= 0; i--) {
        const it = s.items[i];
        it.y += it.vy;
        drawItem(it);

        if (checkHit(it)) {
          if (it.type === "bomb") {
            s.lives--;
            s.comboFlash = 12;
            if (s.lives <= 0) { s.gameOver = true; }
          } else {
            s.score += it.type === "bstar" ? 3 : 1;
            s.comboFlash = 8;
            // 难度
            s.speedMul = 1 + Math.floor(s.score / 10) * 0.35;
            s.spawnGap = Math.max(18, 55 - Math.floor(s.score / 10) * 4);
            for (const item of s.items) item.vy = (item.vy / (s.speedMul - Math.floor((s.score - (it.type === "bstar" ? 3 : 1)) / 10) * 0.35 + 1)) * s.speedMul;
          }
          s.items.splice(i, 1);
          continue;
        }
        if (it.y > window.innerHeight + 30) {
          if (it.type !== "bomb") { s.lives--; if (s.lives <= 0) s.gameOver = true; }
          s.items.splice(i, 1);
        }
      }

      // 篮子
      drawBasket(s.basketX);
      // 接到闪光
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
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "600 22px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("SCORE: " + s.score, 24, 44);
      ctx.fillStyle = s.lives <= 1 ? "rgba(255,100,100,0.9)" : "rgba(255,255,255,0.5)";
      ctx.font = "400 14px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      ctx.fillText("LIVES: " + "o".repeat(s.lives), 24, 66);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "400 13px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("HIGH: " + s.high, window.innerWidth - 24, 44);
      ctx.textAlign = "center";
      ctx.fillText("移动鼠标或按 A/D 或 ← → 键接住星星", window.innerWidth / 2, window.innerHeight - 24);
      ctx.textAlign = "left";

      if (s.gameOver) {
        if (s.score > s.high) { s.high = s.score; try { localStorage.setItem("starCollectorHigh", String(s.high)); } catch {} }
        ctx.fillStyle = "rgba(2,2,16,0.7)";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "600 36px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText("游戏结束", window.innerWidth / 2, window.innerHeight / 2 - 50);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "400 20px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText("得分: " + s.score + "    最高: " + s.high, window.innerWidth / 2, window.innerHeight / 2);
        ctx.fillStyle = "rgba(180,210,255,0.7)";
        ctx.font = "400 16px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText("点击任意位置重新开始", window.innerWidth / 2, window.innerHeight / 2 + 40);

        const restart = () => {
          canvas.removeEventListener("click", restart);
          s.score = 0; s.lives = 3; s.gameOver = false;
          s.items = []; s.spawnTimer = 0; s.speedMul = 1; s.spawnGap = 55;
          requestAnimationFrame(loopRef.current);
        };
        canvas.addEventListener("click", restart);
      }

      if (!s.gameOver) requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      s.paused = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return () => { if (cleanup) cleanup(); };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", position: "fixed", inset: 0, cursor: "none" }}
    />
  );
}
