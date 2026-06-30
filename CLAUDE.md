# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Next.js 16 + React 19 全栈个人网站。前端原生 WebGL 2 黑洞引力透镜（Schwarzschild 光线追踪）+ 星座星图，后端 Neon PostgreSQL + Drizzle ORM + Auth.js GitHub OAuth，Vercel + Vercel Blob 部署。

线上地址：`https://canliuweb.cc.cd`

## Commands

```bash
npm run dev      # 本地开发 (localhost:3000)
npm run build    # 生产构建
npm run start    # 生产服务器
npm run lint     # eslint

# 本地开发绕登录：访问 http://localhost:3000/dev/login
# 数据库迁移（新增表后）：
cp .env.local .env && npx drizzle-kit push && rm .env
```

## Architecture

```
src/
├── app/
│   ├── globals.css          # 自定义样式（导航/面板/星座热区/音乐悬浮条）
│   ├── layout.js            # 根布局 + TrackView 全局埋点
│   ├── page.js              # 主页面 — BlackHole + 导航 + 面板 + 黑洞参数 + 音乐悬浮条
│   ├── Guestbook.jsx        # 留言板组件
│   ├── admin/               # 后台管理
│   │   ├── layout.js        # 侧边栏导航（8 板块）
│   │   ├── login/           # 登录页（GitHub OAuth + 隐藏凭据登录）
│   │   ├── analytics/       # 访问统计
│   │   ├── articles/        # 文章 CRUD（列表/新建/编辑/ArticleForm）
│   │   ├── projects/        # 项目 CRUD（列表/新建/编辑/ProjectForm）
│   │   ├── music/           # 音乐管理（上传/下架/发布）
│   │   ├── messages/        # 留言审核
│   │   ├── comments/        # 评论管理
│   │   ├── settings/        # 网站设置
│   │   └── pegasus/         # 天马座存档（占位）
│   └── api/
│       ├── auth/[...nextauth]/  # Auth.js 路由
│       ├── admin/               # admin API（auth + checkAdmin 鉴权）
│       │   ├── articles/        # 文章 CRUD
│       │   ├── projects/        # 项目 CRUD
│       │   ├── music/           # 音乐 CRUD
│       │   ├── credential-login/# 账号密码登录（凭据在 .env.local）
│       │   ├── analytics/       # 访问统计
│       │   ├── messages/        # 留言审核
│       │   ├── comments/        # 评论审核
│       │   └── settings/        # 设置读写
│       ├── articles/            # 公开文章
│       ├── projects/            # 公开项目
│       ├── music/               # 公开音乐
│       ├── upload-music/        # 大文件上传（绕过 /admin 中间件 body 限制）
│       ├── messages/            # 公开留言
│       ├── settings/            # 公开设置
│       └── track/               # 埋点
├── components/
│   ├── BlackHole.jsx       # 原生 WebGL 2 + ghostty-blackhole 48 步 Schwarzschild 光线追踪
│   ├── ProjectsPanel.jsx   # 轨道式行星卡片 + 详情展开（Markdown 渲染）
│   ├── MusicPlayer.jsx     # 音乐播放器面板
│   ├── ArticlesPanel.jsx   # 文章列表面板（Markdown 渲染 + 评论）
│   └── TrackView.jsx       # 页面访问埋点
├── db/
│   ├── schema.js           # Drizzle 表定义（9 表）
│   └── index.js            # Neon HTTP 连接
├── lib/
│   └── auth-check.js       # 数据库直查 githubUsername 判定管理员
├── auth.js                 # Auth.js v5 配置（GitHub OAuth + DrizzleAdapter）
├── middleware.js            # /admin + /api/admin 鉴权拦截
└── next.config.mjs          # serverActions bodySizeLimit + middlewareClientMaxBodySize
```

## Database — Neon PostgreSQL + Drizzle ORM

| 表 | 用途 |
|------|------|
| `user` | Auth.js 用户（githubUsername / isAdmin） |
| `account` | OAuth 账号关联 |
| `session` | 数据库会话 |
| `article` | 文章（title/slug/content/excerpt/published/allowComments） |
| `project` | 项目（title/content/tags/link/published） |
| `song` | 音乐（title/artist/url/published） |
| `comment` | 文章评论（articleId/name/content/approved/ip） |
| `visitLog` | 访问日志（path/ip/ua/referer） |
| `message` | 留言板（name/content/msgStatus/approved/ip） |
| `setting` | 键值对设置（key/value） |

**连接方式：** `@neondatabase/serverless` HTTP driver，drizzle-kit 管理 migration。

**注意：** `db.execute()` 在 Neon HTTP driver 上不可靠，用 Drizzle query builder 或原生 `neon()` SQL 模板。

## Auth — Auth.js v5 + GitHub OAuth

- 配置：`src/auth.js`，DrizzleAdapter 数据库会话
- 管理员白名单：`ADMIN_GITHUB_USERS` 逗号分隔
- 鉴权：API 和页面统一用 `checkAdmin(userId)` 查 DB githubUsername
- 本地开发：`/dev/login` 一键绕过 OAuth
- 备用登录：登录页底部 `仅限管理员账号登录` 文字可点击，展开凭据登录（凭据在 `.env.local` 的 `LOCAL_ADMIN_USER` / `LOCAL_ADMIN_PASS`）
- Session 30 天有效期，24h 续期

## BlackHole — WebGL 2 光线追踪

- 原生 WebGL 2（非 Three.js），`#version 300 es` shader
- ghostty-blackhole (s0xDk/XboxNahida) 完整移植：48 步 Binet 形式测地线积分
- 8 个吸积盘预设（PRESETS 数组）+ 14 个可调参数
- `uBHMode` uniform 控制光线追踪/经典模式切换
- `public/music/` 已 gitignore（本地文件不提交）
- 手机端（<640px）跳过 WebGL，仅显示深色渐变

## 上传文件

- 音乐上传走 `/api/upload-music`（非 `/admin` 路径，绕过中间件 body size 限制）
- 生产环境使用 Vercel Blob 存储（`@vercel/blob` SDK），需 `BLOB_READ_WRITE_TOKEN` 环境变量
- `next.config.mjs` 配置了 `serverActions.bodySizeLimit: "50mb"` 和 `middlewareClientMaxBodySize: "50mb"`

## Key patterns

- `.env.local` 含真实密钥，已 gitignore
- `public/music/` 已 gitignore（本地测试用）
- Next.js 16 App Router 中 `params` 是 Promise，必须 `await params` 解构
- 大文件上传需绕过中间件路径 `/admin`，否则中间件在 10MB 截断
- CSS 全局 `nav` 样式会污染 admin 侧边栏 `<nav>`，需显式 reset
- 项目规范：禁用 emoji，在代码和 UI 中一律用 SVG 或文字替代
- 预设数据（PRESETS）从 BlackHole.jsx export，page.js import 复用
