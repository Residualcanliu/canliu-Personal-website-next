"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ── 深渊模式 参数默认 & 倍率 ──
const ABYSS_PRESETS = {
  basketW:   { vals: [80,105,130,160,190], mul: [0.35,0.15,0,-0.15,-0.25] },
  fallSpeed: { vals: [0.3,0.4,0.5,0.7,0.9,1.2,1.5], mul: [-0.30,-0.15,0,0.15,0.30,0.50,0.65] },
  moveSpeed: { vals: [7,10,14,18,22],       mul: [0.30,0.15,0,-0.15,-0.25] },
  starSize:  { vals: [0,1,2],               mul: [0.30,0,-0.25] }, // 0=小 1=中 2=大
};
const STAR_SIZE_BASE = { gold: 19, blue: 15, bomb: 17 };
const STAR_SIZE_TIER = [
  { gold: 14, blue: 12, bomb: 12 },  // 小
  { gold: 19, blue: 15, bomb: 17 },  // 中
  { gold: 24, blue: 20, bomb: 22 },  // 大
];
const ABYSS_DEFAULTS = { basketW: 2, fallSpeed: 2, moveSpeed: 2, starSize: 1 }; // index into vals

// ── 技能定义 ──
const SKILLS = [
  { id: "speed",   label: "疾跑",  color: "#60ff80", dur: 8,  desc: "移速 +60%" },
  { id: "magnet",  label: "磁力",  color: "#c080ff", dur: 10, desc: "碗变大 1.6x" },
  { id: "double",  label: "双倍",  color: "#ffd060", dur: 6,  desc: "得分 x2" },
  { id: "shield",  label: "护盾",  color: "#ffffff", dur: 0,  desc: "挡一次炸弹" },
];

export default function StarCollector({ onBack, onModeChange }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const loopRef = useRef(null);
  const menuRef = useRef(null);
  const countdownRef = useRef(0);
  const abyssCfgRef = useRef({ ...ABYSS_DEFAULTS });
  const [mode, setMode] = useState(null);
  const [showAbyssCfg, setShowAbyssCfg] = useState(false);
  const [abyssCfg, setAbyssCfg] = useState({ ...ABYSS_DEFAULTS });

  const startGame = useCallback((gameMode) => {
    countdownRef.current = 3;
    setMode(gameMode);
    setShowAbyssCfg(false);
  }, []);

  const backToMenu = useCallback(() => {
    countdownRef.current = 0;
    setMode(null);
    setShowAbyssCfg(false);
  }, []);
  useEffect(() => { menuRef.current = backToMenu; }, [backToMenu]);
  useEffect(() => { onModeChange?.(mode, showAbyssCfg); }, [mode, showAbyssCfg, onModeChange]);

  // ── 游戏核心 ──
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

    // ── 深渊配置 ──
    const cfg = mode === "abyss" ? { ...abyssCfgRef.current } : null;
    const baseBW = cfg ? ABYSS_PRESETS.basketW.vals[cfg.basketW] : 130;
    const baseFS = cfg ? ABYSS_PRESETS.fallSpeed.vals[cfg.fallSpeed] : 0.5;
    const baseMS = cfg ? ABYSS_PRESETS.moveSpeed.vals[cfg.moveSpeed] : 14;
    const sizeTier = cfg ? STAR_SIZE_TIER[ABYSS_PRESETS.starSize.vals[cfg.starSize]] : STAR_SIZE_TIER[1];
    // 倍率 = 1 + 各参数 mul 之和
    let scoreMul = 1;
    if (cfg) {
      for (const k of ["basketW","fallSpeed","moveSpeed","starSize"]) {
        const idx = cfg[k];
        scoreMul += ABYSS_PRESETS[k].mul[idx];
      }
      scoreMul = Math.round(scoreMul * 100) / 100;
    }

    const basketH = 30;
    // ── 动态碗大小（技能 buff 可改）──
    let curBW = baseBW;
    const getBW = () => curBW;

    // ── 音效 ──
    let audioCtx = null;
    const getAudioCtx = () => {
      if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
      if (audioCtx?.state === "suspended") audioCtx.resume();
      return audioCtx;
    };
    const playSfx = (f, type, d, v, g) => {
      const ac = getAudioCtx(); if (!ac) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (g) o.frequency.linearRampToValueAtTime(f * g, t + d);
      gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(gn); gn.connect(ac.destination);
      o.start(t); o.stop(t + d);
    };
    const sfxStar = () => { playSfx(880,"sine",0.12,0.18,1.3); };
    const sfxBlue = () => { playSfx(660,"sine",0.2,0.22,1.6); setTimeout(()=>playSfx(1100,"sine",0.15,0.14,1.2),80); };
    const sfxBomb = () => { playSfx(100,"sawtooth",0.25,0.2,0.5); };
    const sfxSkill = () => { playSfx(440,"sine",0.15,0.15,2.0); setTimeout(()=>playSfx(880,"sine",0.12,0.12,1.5),60); };
    const sfxShieldBreak = () => { for (let i=0;i<5;i++) setTimeout(()=>playSfx(1800+i*300,"square",0.06,0.08,0.4),i*25); };

    // ── 状态 ──
    const s = {
      mode, score: 0, lives: 3, timeLeft: 60, gameOver: false, paused: false,
      countdown: countdownRef.current,
      basketX: window.innerWidth / 2,
      items: [],
      spawnTimer: 0, spawnGap: 60,
      speedMul: baseFS,
      keys: {},
      high: 0,
      comboFlash: 0,
      startTime: performance.now(),
      // 深渊
      scoreMul,
      abyss: cfg,
      baseBW, baseMS,
      // 技能 buff
      buffs: [],        // { id, label, color, endTime }
      shieldCount: 0,
      doubleScore: false,
      magnetActive: false,
      speedActive: false,
      // 狂热
      feverProgress: 0, feverMax: 30, feverActive: false, feverEnd: 0,
      // 排行榜提交
      submitPhase: 0, playerName: "", nameInput: "", submitMsg: "", submitConflict: false,
    };
    const highKey = "starCollectorHigh_" + (mode === "abyss" ? "abyss" : mode);
    try { s.high = parseInt(localStorage.getItem(highKey) || "0", 10) || 0; } catch { s.high = 0; }
    stateRef.current = s;

    const cdTimer = s.countdown > 0 ? setInterval(() => {
      s.countdown--; countdownRef.current = s.countdown;
      if (s.countdown <= 0) clearInterval(cdTimer);
    }, 800) : null;

    const doSubmit = (overwrite) => {
      const name = s.nameInput.trim() || "匿名";
      s.playerName = name;
      const cfgPayload = s.abyss ? { basketW:ABYSS_PRESETS.basketW.vals[cfg.basketW], fallSpeed:ABYSS_PRESETS.fallSpeed.vals[cfg.fallSpeed], moveSpeed:ABYSS_PRESETS.moveSpeed.vals[cfg.moveSpeed], starSize:ABYSS_PRESETS.starSize.vals[cfg.starSize] } : null;
      fetch("/api/game-scores", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ mode:s.mode, score:s.score, playerName:name, config:cfgPayload, overwrite }) })
        .then(async r => {
          const d = await r.json();
          if (r.status === 409) { s.submitConflict = true; }
          else if (r.status === 400 && d.existingScore != null) { s.submitPhase = 2; s.submitMsg = "未超旧成绩(" + d.existingScore + ")，无需覆盖"; }
          else { s.submitPhase = 2; s.submitConflict = false; s.submitMsg = d.overwritten ? "成绩已覆盖！" : "上传成功！"; }
        }).catch(() => { s.submitMsg = "网络错误"; s.submitPhase = 2; });
    };

    const onKeyDown = (e) => {
      if (s.gameOver && s.submitPhase === 1) {
        if (s.submitConflict) {
          if (e.key === "Enter" || e.key === "y" || e.key === "Y") { doSubmit(true); }
          else if (e.key === "Escape" || e.key === "n" || e.key === "N") { s.submitConflict = false; }
          return;
        }
        if (e.key === "Enter") { doSubmit(false); }
        else if (e.key === "Backspace") { s.nameInput = s.nameInput.slice(0,-1); }
        else if (e.key.length === 1 && s.nameInput.length < 12) { s.nameInput += e.key; }
        return;
      }
      s.keys[e.key] = true;
    };
    const onKeyUp = (e) => { s.keys[e.key] = false; };
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── 生成物品（含技能球）──
    function spawnItem() {
      // 深渊模式：技能球
      if (s.abyss && Math.random() < 0.07) {
        return { x: 30 + Math.random() * (window.innerWidth - 60), y: -20, type: "skill",
          vy: (1.5 + Math.random() * 1.8) * s.speedMul,
          r: 14, glow: 0.8, skillType: SKILLS[Math.floor(Math.random() * SKILLS.length)] };
      }
      // 狂热：无炸弹，大量星星
      const types = s.feverActive
        ? ["star","star","star","star","star","star","bstar","bstar"]
        : ["star","star","star","star","star","bstar","bstar","bomb"];
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        x: 30 + Math.random() * (window.innerWidth - 60), y: -20, type,
        vy: (1.5 + Math.random() * 1.8) * s.speedMul,
        r: type === "bomb" ? sizeTier.bomb : type === "bstar" ? sizeTier.blue : sizeTier.gold,
        glow: Math.random() * 0.4 + 0.6,
      };
    }

    function drawBasket(x) {
      const bw = getBW();
      const cx = Math.max(bw / 2, Math.min(window.innerWidth - bw / 2, x));
      const top = window.innerHeight - 80;
      // 辉光
      const grd = ctx.createRadialGradient(cx, top + basketH / 2, bw * 0.1, cx, top + basketH / 2, bw * 0.7);
      grd.addColorStop(0, "rgba(140,180,255,0.25)");
      grd.addColorStop(0.5, "rgba(100,140,220,0.08)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(cx - bw * 0.7, top - 10, bw * 1.4, basketH + 20);
      // 篮子弧线
      ctx.strokeStyle = s.magnetActive ? "rgba(180,140,255,0.8)" : "rgba(180,210,255,0.7)";
      ctx.lineWidth = s.magnetActive ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(cx - bw / 2, top);
      ctx.quadraticCurveTo(cx - bw / 2, top + basketH + 6, cx, top + basketH + 6);
      ctx.quadraticCurveTo(cx + bw / 2, top + basketH + 6, cx + bw / 2, top);
      ctx.stroke();
      const bg = ctx.createLinearGradient(cx, top, cx, top + basketH + 6);
      bg.addColorStop(0, "rgba(120,160,240,0.18)");
      bg.addColorStop(1, "rgba(60,100,200,0.04)");
      ctx.fillStyle = bg; ctx.fill();
    }

    function drawItem(it) {
      ctx.save();
      if (it.type === "skill") {
        const sk = it.skillType;
        ctx.shadowColor = sk.color; ctx.shadowBlur = 18;
        const grd = ctx.createRadialGradient(it.x, it.y, 2, it.x, it.y, it.r + 2);
        grd.addColorStop(0, sk.color); grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(it.x, it.y, it.r + 2, 0, Math.PI * 2); ctx.fill();
        // 内圈
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath(); ctx.arc(it.x, it.y, it.r * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("?", it.x, it.y + 4);
      } else {
        const gc = it.type === "bomb" ? "255,80,80" : it.type === "bstar" ? "100,180,255" : "240,200,100";
        ctx.shadowColor = `rgba(${gc},${it.glow})`; ctx.shadowBlur = it.r * 1.5;
        ctx.globalAlpha = 0.25; ctx.fillStyle = `rgba(${gc},0.5)`;
        ctx.beginPath(); ctx.arc(it.x, it.y - 4, it.r * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        const body = ctx.createRadialGradient(it.x - it.r * 0.2, it.y - it.r * 0.2, it.r * 0.05, it.x, it.y, it.r);
        if (it.type === "bomb") {
          body.addColorStop(0, "rgba(255,160,160,0.9)"); body.addColorStop(0.6, "rgba(200,50,50,0.7)"); body.addColorStop(1, "rgba(120,20,20,0.2)");
        } else if (it.type === "bstar") {
          body.addColorStop(0, "rgba(180,220,255,0.95)"); body.addColorStop(0.5, "rgba(80,150,240,0.7)"); body.addColorStop(1, "rgba(30,80,180,0.15)");
        } else {
          body.addColorStop(0, "rgba(255,240,180,0.95)"); body.addColorStop(0.5, "rgba(240,180,40,0.7)"); body.addColorStop(1, "rgba(180,100,20,0.15)");
        }
        ctx.fillStyle = body; ctx.beginPath();
        if (it.type === "bomb") { ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2); }
        else {
          const sp = 4, oR = it.r, iR = it.r * 0.4;
          for (let i = 0; i < sp * 2; i++) { const r = i % 2 === 0 ? oR : iR; const a = (Math.PI * 2 * i) / (sp * 2) - Math.PI / 2; i === 0 ? ctx.moveTo(it.x + Math.cos(a) * r, it.y + Math.sin(a) * r) : ctx.lineTo(it.x + Math.cos(a) * r, it.y + Math.sin(a) * r); }
          ctx.closePath();
        }
        ctx.fill();
      }
      ctx.restore();
    }

    function checkHit(it) {
      const bw = getBW();
      const bx = Math.max(bw / 2, Math.min(window.innerWidth - bw / 2, s.basketX));
      const by = window.innerHeight - 80 + basketH / 2;
      return Math.hypot(it.x - bx, it.y - by) < bw * 0.55;
    }

    // ── buff 管理 ──
    function refreshShieldBuff() {
      s.buffs = s.buffs.filter(b => b.id !== "shield");
      if (s.shieldCount > 0) s.buffs.push({ id:"shield", label:"护盾 x"+s.shieldCount, color:"#ffffff", endTime: Infinity });
    }
    function applySkill(sk) {
      const now = performance.now();
      if (sk.id === "shield") { s.shieldCount++; refreshShieldBuff(); return; }
      // 同类型刷新时间
      const exist = s.buffs.find(b => b.id === sk.id);
      const durMs = sk.dur * 1000;
      const end = now + durMs;
      if (exist) exist.endTime = end;
      else s.buffs.push({ ...sk, endTime: end });
      // 应用效果
      if (sk.id === "magnet") { curBW = baseBW * 1.6; s.magnetActive = true; }
      if (sk.id === "speed") s.speedActive = true;
      if (sk.id === "double") s.doubleScore = true;
    }
    function tickBuffs() {
      const now = performance.now();
      s.buffs = s.buffs.filter(b => {
        if (b.endTime < now) {
          if (b.id === "magnet") { curBW = baseBW; s.magnetActive = false; }
          if (b.id === "speed") s.speedActive = false;
          if (b.id === "double") s.doubleScore = false;
          return false;
        }
        return true;
      });
    }

    // ── 主循环 ──
    function loop() {
      loopRef.current = loop;
      if (stateRef.current !== s) return;
      if (s.paused) { requestAnimationFrame(loop); return; }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = s.abyss ? "#08040c" : "#050510";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      const tNow = performance.now() / 1000;
      for (const bs of bgStars) {
        const f = 0.5 + 0.5 * Math.sin(tNow * 1.5 + bs.tw);
        ctx.fillStyle = `rgba(180,200,240,${bs.a * f})`;
        ctx.beginPath(); ctx.arc(bs.x * window.innerWidth, bs.y * window.innerHeight, bs.r, 0, Math.PI * 2); ctx.fill();
      }

      // 倒计时
      if (s.countdown > 0) {
        ctx.textAlign = "center";
        const p = 1 + (1 - (s.countdown % 1)) * 0.3;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = `600 ${80 * p}px "PingFang SC","Microsoft YaHei UI",sans-serif`;
        ctx.fillText(String(Math.ceil(s.countdown)), window.innerWidth / 2, window.innerHeight / 2 + 16);
        requestAnimationFrame(loop); return;
      }

      // buff + 狂热计时
      tickBuffs();
      if (s.feverActive && performance.now() >= s.feverEnd) { s.feverActive = false; s.feverProgress = 0; }

      // 游戏结束
      if (s.gameOver) {
        const fs = s.score;
        if (fs > s.high) { s.high = fs; try { localStorage.setItem(highKey, String(s.high)); } catch {} }
        ctx.fillStyle = "rgba(2,2,16,0.7)"; ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.textAlign = "center";

        if (s.submitPhase === 0) {
          // 显示分数 + 上传/跳过按钮
          ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "600 36px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
          ctx.fillText("游戏结束", window.innerWidth / 2, window.innerHeight / 2 - 80);
          ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "400 20px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
          ctx.fillText("得分: " + fs + "    最高: " + s.high, window.innerWidth / 2, window.innerHeight / 2 - 30);
          // 上传按钮
          const btnX = window.innerWidth / 2 - 90, btnY = window.innerHeight / 2 + 10;
          ctx.fillStyle = "rgba(100,180,255,0.15)"; ctx.fillRect(btnX, btnY, 80, 36);
          ctx.fillStyle = "rgba(200,220,255,0.8)"; ctx.font = "400 15px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
          ctx.fillText("上传成绩", btnX + 40, btnY + 24);
          // 跳过按钮
          ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(btnX + 100, btnY, 80, 36);
          ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillText("跳过", btnX + 140, btnY + 24);

          const clickSubmit = (e) => {
            const cx = e.clientX, cy = e.clientY;
            if (cx >= btnX && cx <= btnX + 80 && cy >= btnY && cy <= btnY + 36) { s.submitPhase = 1; canvas.removeEventListener("click", clickSubmit); }
            else if (cx >= btnX + 100 && cx <= btnX + 180 && cy >= btnY && cy <= btnY + 36) { canvas.removeEventListener("click", clickSubmit); s.submitPhase = -1; }
          };
          canvas.addEventListener("click", clickSubmit);
        } else if (s.submitPhase === 1) {
          if (s.submitConflict) {
            // 同名冲突确认
            ctx.fillStyle = "rgba(255,180,60,0.9)"; ctx.font = "600 22px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
            ctx.fillText("名字已存在，是否覆盖？", window.innerWidth / 2, window.innerHeight / 2 - 50);
            ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "400 14px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
            ctx.fillText("Enter/Y 覆盖    N/Esc 取消", window.innerWidth / 2, window.innerHeight / 2 - 10);
          } else {
            // 输入名字
            ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "600 28px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
            ctx.fillText("上传成绩 — 输入名字", window.innerWidth / 2, window.innerHeight / 2 - 60);
            ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "400 16px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
            ctx.fillText(s.nameInput + (Math.floor(performance.now() / 500) % 2 ? "|" : " "), window.innerWidth / 2, window.innerHeight / 2 - 10);
            ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "400 12px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
            ctx.fillText("输入后按 Enter 提交", window.innerWidth / 2, window.innerHeight / 2 + 20);
          }
        } else if (s.submitPhase === 2) {
          ctx.fillStyle = "rgba(100,255,140,0.6)"; ctx.font = "400 16px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
          ctx.fillText(s.submitMsg || "上传成功！", window.innerWidth / 2, window.innerHeight / 2 + 20);
          ctx.fillStyle = "rgba(180,210,255,0.7)"; ctx.font = "400 14px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
          ctx.fillText("点击任意位置返回菜单", window.innerWidth / 2, window.innerHeight / 2 + 48);
          const goMenu = () => { canvas.removeEventListener("click", goMenu); menuRef.current?.(); };
          canvas.addEventListener("click", goMenu);
        } else {
          // submitPhase === -1: 跳过
          const goMenu = () => { canvas.removeEventListener("click", goMenu); menuRef.current?.(); };
          canvas.addEventListener("click", goMenu);
          ctx.fillStyle = "rgba(180,210,255,0.7)"; ctx.font = "400 14px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
          ctx.fillText("点击任意位置返回菜单", window.innerWidth / 2, window.innerHeight / 2 + 48);
        }
        requestAnimationFrame(loop); return;
      }

      // 键盘移动
      const spd = s.speedActive ? s.baseMS * 1.6 : s.baseMS;
      const kx = (s.keys["ArrowLeft"] || s.keys["a"] || s.keys["A"]) ? -spd
        : (s.keys["ArrowRight"] || s.keys["d"] || s.keys["D"]) ? spd : 0;
      s.basketX += kx;
      s.basketX = Math.max(getBW() / 2, Math.min(window.innerWidth - getBW() / 2, s.basketX));

      // 计时模式倒计时
      if (s.mode === "timed") {
        const elapsed = (performance.now() - s.startTime) / 1000;
        s.timeLeft = Math.max(0, 60 - elapsed);
        if (s.timeLeft <= 0) s.gameOver = true;
      }

      // 生成（狂热时加速）
      const gap = s.feverActive ? 15 : s.spawnGap;
      s.spawnTimer++;
      if (s.spawnTimer >= gap) { s.spawnTimer = 0; s.items.push(spawnItem()); }

      // 更新物品
      for (let i = s.items.length - 1; i >= 0; i--) {
        const it = s.items[i];
        it.y += it.vy;
        drawItem(it);
        if (checkHit(it)) {
          if (it.type === "bomb") {
            if (s.shieldCount > 0) { sfxShieldBreak(); s.shieldCount--; refreshShieldBuff(); }
            else { sfxBomb(); if (s.mode === "lives" || s.abyss) { s.lives--; if (s.lives <= 0) s.gameOver = true; } else { s.score = Math.max(0, s.score - 3); } }
            s.comboFlash = 12;
          } else if (it.type === "skill") {
            sfxSkill(); applySkill(it.skillType); s.comboFlash = 10;
          } else {
            if (it.type === "bstar") sfxBlue(); else sfxStar();
            const pts = (it.type === "bstar" ? 3 : 1) * (s.doubleScore ? 2 : 1);
            s.score += Math.round(pts * s.scoreMul);
            // 狂热进度
            if (!s.feverActive) { s.feverProgress += it.type === "bstar" ? 3 : 1; if (s.feverProgress >= s.feverMax) { s.feverActive = true; s.feverEnd = performance.now() + 7000; s.feverProgress = s.feverMax; } }
            s.comboFlash = 8;
            if (!s.abyss) {
              s.speedMul = 0.5 + Math.floor(Math.max(0, s.score) / 12) * 0.2;
              s.spawnGap = Math.max(22, 60 - Math.floor(Math.max(0, s.score) / 12) * 3);
            }
          }
          s.items.splice(i, 1); continue;
        }
        if (it.y > window.innerHeight + 30) { s.items.splice(i, 1); }
      }

      // 篮子 + 闪光
      drawBasket(s.basketX);
      if (s.comboFlash > 0) { s.comboFlash--;
        const bx = Math.max(getBW() / 2, Math.min(window.innerWidth - getBW() / 2, s.basketX));
        const by = window.innerHeight - 80 + basketH / 2;
        ctx.fillStyle = `rgba(200,220,255,${s.comboFlash / 12 * 0.3})`;
        ctx.beginPath(); ctx.arc(bx, by, getBW() * 0.4 + (12 - s.comboFlash) * 4, 0, Math.PI * 2); ctx.fill();
      }

      // ── HUD ──
      ctx.textAlign = "center";

      // 狂热进度条
      const barW = 200, barH = 6, barX = window.innerWidth / 2 - barW / 2, barY = 24;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(barX, barY, barW, barH);
      const prog = Math.min(1, s.feverProgress / s.feverMax);
      if (s.feverActive) {
        const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 200);
        ctx.fillStyle = `rgba(255,200,60,${pulse})`;
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = "rgba(255,200,60,0.9)"; ctx.font = "600 12px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText("FEVER! " + Math.max(0, ((s.feverEnd - performance.now()) / 1000)).toFixed(1) + "s", window.innerWidth / 2, barY - 6);
      } else if (prog > 0) {
        ctx.fillStyle = "rgba(140,180,255,0.5)";
        ctx.fillRect(barX, barY, barW * prog, barH);
      }

      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = "400 13px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      ctx.fillText("分数", window.innerWidth / 2, barY + 30);
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "600 40px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      ctx.fillText(s.score, window.innerWidth / 2, 92);

      // 深渊：倍率
      let nextY = 132;
      if (s.abyss) {
        ctx.fillStyle = s.scoreMul >= 2 ? "rgba(255,180,60,0.7)" : "rgba(255,255,255,0.3)";
        ctx.font = "400 15px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText("倍率 x" + s.scoreMul.toFixed(2), window.innerWidth / 2, nextY);
        nextY += 28;
      }

      // 生命 / 时间
      ctx.font = "400 18px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      if (s.mode === "timed") {
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillText("时间", window.innerWidth / 2, nextY);
        ctx.fillStyle = s.timeLeft <= 10 ? "rgba(255,100,100,0.9)" : "rgba(255,255,255,0.55)";
        ctx.font = "600 22px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText(s.timeLeft.toFixed(1) + "s", window.innerWidth / 2, nextY + 22);
        nextY += 48;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillText("生命", window.innerWidth / 2, nextY);
        ctx.fillStyle = s.lives <= 1 ? "rgba(255,100,100,0.9)" : "rgba(255,255,255,0.55)";
        ctx.font = "600 22px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
        ctx.fillText(String(Math.max(0, s.lives)), window.innerWidth / 2, nextY + 22);
        nextY += 48;
      }

      // 深渊：buff 状态
      if (s.abyss && s.buffs.length > 0) {
        const now = performance.now();
        for (const b of s.buffs) {
          const rem = b.endTime === Infinity ? "--" : Math.max(0, ((b.endTime - now) / 1000)).toFixed(1) + "s";
          ctx.fillStyle = b.color;
          ctx.font = "500 14px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
          ctx.fillText(b.label + " " + rem, window.innerWidth / 2, nextY);
          nextY += 20;
        }
      }

      ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.font = "400 12px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      ctx.fillText("最高: " + s.high, window.innerWidth / 2, nextY + 4);
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
    if (mode === null || showAbyssCfg) return;
    const cleanup = init();
    return () => { if (cleanup) cleanup(); };
  }, [mode, showAbyssCfg, init]);

  // ── 深渊参数配置画面 ──
  if (showAbyssCfg) {
    const cfg = abyssCfg;
    const update = (k, v) => { const next = { ...abyssCfg, [k]: v }; setAbyssCfg(next); abyssCfgRef.current = next; };
    let mul = 1;
    for (const k of ["basketW","fallSpeed","moveSpeed","starSize"]) { mul += ABYSS_PRESETS[k].mul[cfg[k]]; }
    mul = Math.round(mul * 100) / 100;

    const sl = { display:"flex",flexDirection:"column",gap:6,width:"100%",maxWidth:380 };
    const lbl = { display:"flex",justifyContent:"space-between",fontSize:"0.85rem",color:"rgba(255,255,255,0.65)" };
    const rangeS = { width:"100%",accentColor:"rgba(140,180,255,0.8)",cursor:"pointer" };
    const bv = ["极小","较小","标准","较大","超大"];
    const fv = ["极慢","慢","标准","快","很快","风暴","深渊风暴"];
    const mv = ["龟速","慢","标准","快","极速"];
    const sv = ["小","中","大"];

    return (
      <div style={{ width:"100vw",height:"100vh",background:"#050510",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"\"PingFang SC\",\"Microsoft YaHei UI\",sans-serif",overflowY:"auto",padding:"40px 20px" }}>
        <div style={{ fontSize:"1.8rem",fontWeight:600,marginBottom:8,textShadow:"0 0 30px rgba(140,190,250,0.35)" }}>深渊模式 · 自定义难度</div>
        <div style={{ fontSize:"0.85rem",color:"rgba(255,255,255,0.3)",marginBottom:12 }}>难度越高倍率越高，得分 = 原始分 * 倍率</div>

        <div style={{ fontSize:"2rem",fontWeight:600,marginBottom:24,color: mul >= 2 ? "#ffb83c" : mul >= 1.5 ? "#ffd060" : "rgba(255,255,255,0.8)" }}>
          倍率 x{mul.toFixed(2)}
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:20,width:380 }}>
          <div style={sl}>
            <div style={lbl}><span>碗大小</span><span>{bv[cfg.basketW]}</span></div>
            <input type="range" min={0} max={4} step={1} value={cfg.basketW} onChange={e => update("basketW",+e.target.value)} style={rangeS} />
          </div>
          <div style={sl}>
            <div style={lbl}><span>下落速度</span><span>{fv[cfg.fallSpeed]}</span></div>
            <input type="range" min={0} max={6} step={1} value={cfg.fallSpeed} onChange={e => update("fallSpeed",+e.target.value)} style={rangeS} />
          </div>
          <div style={sl}>
            <div style={lbl}><span>碗移速</span><span>{mv[cfg.moveSpeed]}</span></div>
            <input type="range" min={0} max={4} step={1} value={cfg.moveSpeed} onChange={e => update("moveSpeed",+e.target.value)} style={rangeS} />
          </div>
          <div style={sl}>
            <div style={lbl}><span>星星大小</span><span>{sv[cfg.starSize]}</span></div>
            <input type="range" min={0} max={2} step={1} value={cfg.starSize} onChange={e => update("starSize",+e.target.value)} style={rangeS} />
          </div>
        </div>

        <div style={{ marginTop:28,display:"flex",gap:20,fontSize:"0.72rem",flexWrap:"wrap",justifyContent:"center" }}>
          {SKILLS.map(sk => (
            <div key={sk.id} style={{ display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ color:sk.color,fontSize:"1rem" }}>?</span>
              <span style={{ color:"rgba(255,255,255,0.4)" }}>{sk.label}: {sk.desc}</span>
            </div>
          ))}
        </div>

        <button onClick={() => startGame("abyss")} style={{
          marginTop:28,padding:"14px 48px",fontSize:"1.1rem",fontWeight:500,
          color:"#fff",background: mul >= 2 ? "rgba(255,160,40,0.25)" : "rgba(100,160,255,0.2)",
          border: mul >= 2 ? "1px solid rgba(255,160,40,0.4)" : "1px solid rgba(100,160,255,0.3)",
          borderRadius:10,cursor:"pointer",transition:"background 0.2s",
        }}>开始游戏</button>

        <a onClick={backToMenu} style={{ marginTop:24,fontSize:"0.82rem",color:"rgba(255,255,255,0.3)",cursor:"pointer",textDecoration:"none" }}>← 返回菜单</a>
      </div>
    );
  }

  // ── 菜单画面 ──
  if (mode === null) {
    return (
      <div style={{ width:"100vw",height:"100vh",background:"#050510",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"\"PingFang SC\",\"Microsoft YaHei UI\",sans-serif" }}>
        <div style={{ fontSize:"2.2rem",fontWeight:600,marginBottom:8,textShadow:"0 0 40px rgba(140,190,250,0.4)" }}>人马座 · 星点收集</div>
        <div style={{ fontSize:"0.9rem",color:"rgba(255,255,255,0.35)",marginBottom:28 }}>按 A/D 或 ← → 键移动篮子，接住下落星星</div>

        <div style={{ display:"flex",gap:28,marginBottom:40,fontSize:"0.78rem" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}><span style={{ color:"#e8b830",fontSize:"1.2rem" }}>*</span><span style={{ color:"rgba(255,255,255,0.45)" }}>金色星 +1</span></div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}><span style={{ color:"#60b0f0",fontSize:"1.2rem" }}>*</span><span style={{ color:"rgba(255,255,255,0.45)" }}>蓝色星 +3</span></div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}><span style={{ color:"#f05050",fontSize:"1.2rem" }}>o</span><span style={{ color:"rgba(255,255,255,0.45)" }}>炸弹 -3 / -1命</span></div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}><span style={{ color:"#ffd060",fontSize:"1.2rem" }}>?</span><span style={{ color:"rgba(255,255,255,0.45)" }}>技能球(深渊)</span></div>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:16,width:300 }}>
          <button onClick={() => startGame("timed")} style={modeBtn}>
            <div style={{ fontSize:"1.35rem",fontWeight:500 }}>计时模式 — 60 秒</div>
            <div style={{ fontSize:"0.8rem",color:"rgba(255,255,255,0.3)",marginTop:5 }}>限时得分，接炸弹扣分，漏接不扣分</div>
          </button>
          <button onClick={() => startGame("lives")} style={modeBtn}>
            <div style={{ fontSize:"1.35rem",fontWeight:500 }}>生命模式 — 3 条命</div>
            <div style={{ fontSize:"0.8rem",color:"rgba(255,255,255,0.3)",marginTop:5 }}>接炸弹扣命，漏接不扣分，坚持越久分数越高</div>
          </button>
          <button onClick={() => setShowAbyssCfg(true)} style={{ ...modeBtn, borderColor:"rgba(255,160,40,0.25)" }}>
            <div style={{ fontSize:"1.35rem",fontWeight:500 }}>深渊模式 — 自定义</div>
            <div style={{ fontSize:"0.8rem",color:"rgba(255,255,255,0.3)",marginTop:5 }}>自定难度 + 技能系统，难度越高倍率越高</div>
          </button>
        </div>

        <a onClick={onBack} style={{ marginTop:40,fontSize:"0.82rem",color:"rgba(255,255,255,0.3)",cursor:"pointer",textDecoration:"none" }}>← 返回主页</a>
      </div>
    );
  }

  return <canvas ref={canvasRef} style={{ display:"block",position:"fixed",inset:0 }} />;
}

const modeBtn = { width:"100%",padding:"18px 24px",textAlign:"left",color:"rgba(255,255,255,0.85)",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,cursor:"pointer",transition:"background 0.2s,border-color 0.2s" };
