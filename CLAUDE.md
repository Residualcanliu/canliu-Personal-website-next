# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Next.js 16 + React 19 personal website. Black hole / gravitational lensing background rendered with Three.js + custom GLSL shaders, four real constellation star charts at screen corners, five-page panel navigation. Tailwind CSS v4.

## Commands

```bash
npm run dev      # dev server (default port 3000)
npm run build    # production build
npm run start    # production server
npm run lint     # eslint
```

## Architecture

```
src/
├── app/
│   ├── globals.css   # 全部自定义样式（玻璃拟态导航、面板、星座热区）
│   ├── layout.js     # 根布局（<html lang="zh-CN">）
│   └── page.js       # 主页面 — "use client"，组合 BlackHole + 导航 + 面板
└── components/
    └── BlackHole.jsx # Three.js 渲染 — 全部 GLSL 着色器 + 动画循环 + BH移动
```

### BlackHole.jsx — Three.js 核心 (~350行)

"use client" 组件。`useEffect` 挂载 Three.js WebGL 渲染器，`useEffect cleanup` 释放资源。

包含：
- Canvas 初始化 + 画布纹理生成（"欢迎来到我的频道" + 提示小字）
- 完整 GLSL 片段着色器（~280行 GLSL 源码）
- BH 移动：鼠标吸引（<45% 屏幕）→ 随机路标巡逻（恒定速度 50px/s）
- 键盘 (R 重置) / 鼠标 / resize 事件
- FPS 时钟 + requestAnimationFrame 循环

### page.js — 页面系统

`useState(current)` 管理打开面板，`useCallback(show/hide)` 控制切换。包含导航栏 5 项、四角星座点击热区、五个半透明面板（pn-home / pn-profile / pn-or / pn-ly / pn-cy）。Esc 键关闭。

### 样式 (globals.css)

玻璃拟态导航 (`backdrop-filter: blur`)，半透明面板 (`rgba(2,2,12,.65)`)，星座热区 (22vmin)，暗色背景 `#020208`。

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| three | 0.185 | WebGL rendering |
| next | 16.2 | Framework |
| react/react-dom | 19.2 | UI |
| tailwindcss | 4 | Utility CSS |

## Shader pipeline (GLSL main 渲染顺序)

1. `renderBackground(uv)` — FBM 星云 (gas/dust/emission)
2. `renderStars(uv, time)` — 7 层程序化星空
3. `lensDeflect(px, bh, r)` — 引力偏折 `r²*14/distance` + 阴影
4. Background blend: unlensed → lensed (`blendLens`, `infR=r*12`, `lensMag`)
5. Shadow + `renderConstellations(luv, time)` — 四星座（透镜 UV）
6. `renderEventHorizon(px, bh, r)` — 纯暗球体
7. `renderDisk(px, bh, r, time)` — 三段式吸积盘（下/上/中盘桥接）
8. Text overlay → `toneMapping` (ACES) → `postProcess` (CA + grain + vignette)

## Four constellations (真实实测坐标，GLSL 编码)

| 方位 | 星座 | 页面 | 星数 | 特征 |
|------|------|------|------|------|
| 左上 | ♌ Leo | 个人(profile) | 9 | 镰刀弧 + 躯干 + 尾巴 |
| 右上 | 🗡 Orion | 项目(or) | 17 | 沙漏躯干 + 三星腰带 + 臂分叉 |
| 左下 | ♫ Lyra | 文章(ly) | 5 | 平行四边形 + 织女星 |
| 右下 | 🦢 Cygnus | 联系(cy) | 9 | 北十字竖轴 + 左右翼 |

## GLSL 常见陷阱

- `smoothstep(a, a, x)` — 边相等 → NaN → 黑屏
- `normalize(vec2(0))` → NaN
- `doppler`: 已从 `sin(beamAngle*0.5)` → `cos(beamAngle)` 修复 ±π 不连续性
- 坐标空间：`uBH` y-up (Three.js)，CSS y-down

## 迁移来源

v2.0 从单 HTML 文件迁移而来。原项目备份在 `canliu-Personal-website` 仓库，v1.2。完整的视觉和行为逻辑原封保留。
