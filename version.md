# Version History — canliu-personal-website

## v2.1 (2026-06-28)

| 文件 | 改动 |
|------|------|
| `src/app/page.js` | pn-profile 面板结构化：左侧头像+用户名+状态 / 右侧标题+简介+标签 |
| `src/components/BlackHole.jsx` | 主页顶部实时时钟（年月日时分秒），画布纹理每秒刷新，受黑洞引力透镜弯曲 |

## v2.0 (2026-06-27)

| Commit | 说明 |
|--------|------|
| `98c18a0` | 更新 CLAUDE.md — Next.js 项目文档 |
| `839c505` | v2.0: 迁移至 Next.js — 保留全部黑洞视觉+星座星图+面板系统 |

**迁移详情：**
- 从单 HTML 文件（v1.2, 原仓库 `canliu-Personal-website`）迁移至 Next.js 16 + React 19
- Three.js 0.185 WebGL 渲染，自定义 GLSL 着色器（~280 行）
- 四个真实星座星图（Leo / Orion / Lyra / Cygnus），实测坐标
- 五页面板系统（首页 / 个人 / 项目 / 文章 / 联系），useState 状态管理
- Tailwind CSS v4 + 玻璃拟态导航
- 黑洞移动：鼠标吸引 + 随机路标巡逻
- 修复 GLSL `smoothstep(a,a,x)` NaN → 黑屏 bug

## v1.x (原始 HTML)

详见原仓库 `Residualcanliu/canliu-Personal-website`，最终版 v1.2。
