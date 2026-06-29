# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Next.js 16 + React 19 全栈个人网站。前端 Three.js 黑洞引力透镜 + GLSL 星座星图，后端 Neon PostgreSQL + Drizzle ORM + Auth.js GitHub OAuth，Vercel 部署。Tailwind CSS v4。

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
│   ├── globals.css          # 全部自定义样式（导航/面板/星座热区/头像/留言气泡）
│   ├── layout.js            # 根布局 + TrackView 全局埋点
│   ├── page.js              # 主页面 "use client" — BlackHole + 导航 + 面板 + 设置
│   ├── Guestbook.jsx        # 留言板组件（表单/emoji选择器/气泡展示）
│   ├── admin/               # 后台管理页面
│   │   ├── layout.js        # 侧边栏导航布局（7 板块）
│   │   ├── page.js          # 仪表盘（文章数/今日访问/总访问）
│   │   ├── analytics/       # 访问统计（折线图 + 热力图 + Top10）
│   │   ├── articles/        # 文章 CRUD（列表/新建/编辑/ArticleForm）
│   │   ├── messages/        # 留言审核（通过/拒绝/删除）
│   │   ├── settings/        # 网站设置（状态文字 + 圆点颜色）
│   │   ├── projects/        # 项目管理（占位）
│   │   └── pegasus/         # 天马座存档（占位）
│   └── api/
│       ├── auth/[...nextauth]/  # Auth.js 路由
│       ├── admin/               # admin API（鉴权）
│       │   ├── analytics/       # 访问统计（并行查询）
│       │   ├── articles/        # 文章 CRUD
│       │   ├── messages/        # 留言审核
│       │   └── settings/        # 设置读写
│       ├── articles/            # 公开文章 API
│       ├── messages/            # 公开留言 API（提交+列表）
│       ├── settings/            # 公开设置 API（读状态）
│       └── track/               # 埋点（过滤 bot + admin 路径）
├── components/
│   ├── BlackHole.jsx       # Three.js 全部渲染逻辑（forwardRef，接受 speed/attract ref）
│   └── TrackView.jsx       # 页面访问埋点组件
├── db/
│   ├── schema.js           # Drizzle 表定义（6 表）
│   └── index.js            # Neon HTTP 连接
├── lib/
│   └── auth-check.js       # 数据库直查 githubUsername 判定管理员
├── auth.js                 # Auth.js v5 配置（GitHub OAuth + DrizzleAdapter）
└── middleware.js            # /admin + /api/admin 鉴权拦截
```

## Database — Neon PostgreSQL + Drizzle ORM

**6 张表：**
| 表 | 用途 |
|------|------|
| `user` | Auth.js 用户（含自定义 githubUsername / isAdmin） |
| `account` | OAuth 账号关联 |
| `session` | 数据库会话 |
| `article` | 文章（title/slug/content/excerpt/published） |
| `visitLog` | 访问日志（path/ip/ua/referer） |
| `message` | 留言板（name/content/msgStatus/approved） |
| `setting` | 键值对设置（key/value） |

**连接方式：** `@neondatabase/serverless` HTTP driver，drizzle-kit 管理 migration。

**注意：** `db.execute()` 在 Neon HTTP driver 上不可靠，用 Drizzle query builder 或原生 `neon()` SQL 模板。

## Auth — Auth.js v5 + GitHub OAuth

- 配置：`src/auth.js`，使用 DrizzleAdapter 数据库会话
- 管理员白名单：环境变量 `ADMIN_GITHUB_USERS` 逗号分隔
- 鉴权方式：API 和页面端统一用 `checkAdmin(userId)` 查数据库 githubUsername（不用 session.user.isAdmin，因为 DrizzleAdapter 不填自定义字段）
- `events.linkAccount` + `signIn` 回调自动写入 githubUsername
- Session 30 天有效期，24h 续期
- 本地开发：`/dev/login` 一键绕过 OAuth（该目录已 gitignore）

## BlackHole.jsx — Three.js 核心

`forwardRef` 组件，通过 `useImperativeHandle` 暴露 `{ speed, attract }` 给 page.js 动画循环读取。

**缩放星座坐标：** 四个星座星点已按质心等比缩放到 60%，修改时需同步调整 CSS 热区位置。

**控制面板：** nav 栏 "控制黑洞" 按钮，速度 20-160 px/s，吸附 15%-65%。

## Key patterns

- `.env.local` 含真实密钥，已 gitignore
- `src/app/dev/` 已 gitignore，本地开发专用
- 埋点 `POST /api/track` 过滤 bot UA + admin/api/dev 路径
- CSS 全局 `nav` 样式会污染 admin 侧边栏 `<nav>`，需显式 reset position/display
- admin 页面不使用全局 nav/BlackHole，独立布局
