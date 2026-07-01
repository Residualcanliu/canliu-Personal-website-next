# Version History — canliu-personal-website

## v3.3 (2026-06-30) — 音乐角 + Vercel Blob 存储

**音乐管理系统：**
| 功能 | 说明 |
|------|------|
| song 表 | 新增数据库表（title/artist/url/published），Drizzle schema |
| Admin CRUD | /admin/music 管理页：上传本地文件 + 贴外部链接 |
| 公开 API | /api/music 返回已发布歌曲列表 |
| 大文件上传 | /api/upload-music 绕过 /admin 中间件 body size 限制 |

**Vercel Blob 云端存储：**
- 抛弃本地 `public/music/` 上传，改用 `@vercel/blob` SDK
- `next.config.mjs` 配置 `serverActions.bodySizeLimit: "50mb"` + `middlewareClientMaxBodySize: "50mb"`
- 需 `BLOB_READ_WRITE_TOKEN` 环境变量

**MusicPlayer 组件：**
- 歌单播放器面板 + 页面底部悬浮迷你控制条
- 导航栏 "联系" 改为 "音乐"

**附带修复：**
- 自定义参数继承当前预设值，不再跳回默认
- 星座连线 offset 修正 + 辉光效果
- 全站 emoji 替换为 SVG 图标

## v3.2 (2026-06-30) — 项目轨道面板完善

| 改动 | 说明 |
|------|------|
| Markdown 渲染 | 项目详情支持 Markdown 内容展示 |
| 行星小球 | 轨道式卡片增加行星装饰元素 |
| 编辑优化 | ProjectForm 编辑器改进 |

## v3.1 (2026-06-30) — 项目管理 + 账号密码登录

**项目管理系统：**
| 功能 | 说明 |
|------|------|
| project 表 | 数据库表（title/content/tags/link/published） |
| Admin CRUD | /admin/projects 管理页：列表/新建/编辑/ProjectForm |
| 公开 API | /api/projects 返回已发布项目列表 |
| ProjectsPanel | 轨道式行星卡片展示，可展开详情 |

**账号密码登录：**
- 登录页底部隐藏凭据登录入口（`LOCAL_ADMIN_USER` / `LOCAL_ADMIN_PASS`）
- `/api/admin/credential-login` 备用登录 API
- 排版统一优化

## v3.0 (2026-06-30) — WebGL 2 黑洞重写

基于 ghostty-blackhole (s0xDk) 完整移植：
- 原生 WebGL 2 替换 Three.js，48 步 Binet 形式测地线积分
- 8 个吸积盘预设（Inferno/Gargantua/M87*/Quasar/Blazar 等），键盘 0-7 切换
- 14 个可调盘参数（色温/倾角/半径/Doppler/Beaming 等）
- Canvas 星云纹理 + 星座辉光连线
- 鼠标拖拽/吸附/自动巡逻，滚轮调大小
- 默认 Inferno 烈焰预设，吸附 20%，尺寸 0.7x
- 手机端自动降级为深色渐变背景

## v2.9 (2026-06-28) — 个人面板 + 留言板系统

**个人面板完善：** 头像(cat.jpg) / 名字 gch / 残留v枫楪 / 可编辑状态圆点 / 标签 / 个人简介 / 联系方式链接

**留言板系统：**
| 功能 | 说明 |
|------|------|
| 提交表单 | 昵称 + emoji选择器 + 状态文字 + 留言内容 |
| 审核机制 | 提交后进入待审 → admin 通过/拒绝/删除 |
| 气泡展示 | 已通过留言在全屏面板左右交替展示，名字 + emoji状态 + 内容 |
| admin 审核页 | /admin/messages，侧边栏入口 |

**其他：**
- admin 设置页：个人状态文字 + 圆点颜色选择
- setting 表 + message 表新增
- 埋点过滤爬虫 UA（26 种常见 bot）

## v2.8 (2026-06-28) — 主页面优化

| 改动 | 说明 |
|------|------|
| 星座等比缩放 60% | 四星座星点坐标向质心收缩，整体缩小近一半 |
| 黑洞下移 | 初始位置 y=45% → y=78%，从屏幕下方生成 |
| 黑洞实时控制 | nav 栏「控制黑洞」面板：速度 (20-160) + 吸附范围 (15%-65%) |

## v2.7 (2026-06-28) — 访问统计完善

| 改动 | 说明 |
|------|------|
| 埋点过滤 | TrackView 过滤 /admin /api /dev 路径 |
| 查询并行 | 6 SQL → Promise.all 并行 |
| 两栏自适应布局 | 左图表 / 右 Top 10 |
| 清空数据 | 一键清空访问记录 |

## v2.6 (2026-06-28) — admin 侧边栏 + 访问统计

| 改动 | 说明 |
|------|------|
| admin 侧边栏 | 6 板块导航（首页/访问/文章/项目/天马座/设置） |
| 访问统计 | 折线图 + 热力图 + Top 页面 |
| 埋点系统 | TrackView 全局自动记录 PV |

## v2.5 (2026-06-28) — admin 重构

| 改动 | 说明 |
|------|------|
| admin 侧边栏布局 | 左侧导航 + 右侧内容区 |
| 仪表盘数据卡片 | 文章数/今日访问/总访问（实时） |
| 4 个占位板块 | analytics / projects / pegasus / settings |

## v2.4 (2026-06-28) — 阶段 B：文章 CRUD 系统

**新增文件：**
| 文件 | 说明 |
|------|------|
| `src/app/api/admin/articles/route.js` | GET 列表 + POST 创建（admin 鉴权） |
| `src/app/api/admin/articles/[id]/route.js` | GET / PUT / DELETE 单篇（admin 鉴权） |
| `src/app/api/articles/route.js` | GET 公开列表（仅已发布） |
| `src/app/api/articles/[slug]/route.js` | GET 公开单篇（按 slug） |
| `src/app/admin/articles/page.js` | 文章管理列表页（编辑/删除） |
| `src/app/admin/articles/ArticleForm.jsx` | 共享编辑器组件（标题/slug/摘要/正文/发布） |
| `src/app/admin/articles/new/page.js` | 新建文章页 |
| `src/app/admin/articles/[id]/edit/page.js` | 编辑文章页 |

**改动文件：**
| 文件 | 改动 |
|------|------|
| `src/middleware.js` | matcher 增加 `/api/admin/:path*` 保护 |
| `src/app/admin/page.js` | 仪表盘「文章」卡片可点击跳转 |

## v2.3 (2026-06-28) — 阶段 A：数据库 + OAuth 登录 + admin 后台

**新增依赖：** `next-auth@5.0.0-beta.31` `@auth/drizzle-adapter` `drizzle-orm` `@neondatabase/serverless` `drizzle-kit`

**新增文件：**
| 文件 | 说明 |
|------|------|
| `src/db/schema.js` | Drizzle 表定义：user / account / session / article / visitLog |
| `src/db/index.js` | Neon 数据库连接 (HTTP) |
| `src/auth.js` | Auth.js 配置：GitHub OAuth + DrizzleAdapter + admin 白名单 |
| `src/app/api/auth/[...nextauth]/route.js` | Auth.js API 路由 |
| `src/middleware.js` | /admin 路径鉴权拦截 |
| `src/app/admin/page.js` | 后台仪表盘（登录后可见） |
| `src/app/admin/layout.js` | 后台布局 |
| `src/app/admin/login/page.js` | GitHub 登录页（含错误码显示） |
| `drizzle.config.js` | Drizzle Kit 配置 |
| `.env.local` | 本地环境变量（DATABASE_URL / AUTH_SECRET / AUTH_GITHUB_ID / AUTH_GITHUB_SECRET / ADMIN_GITHUB_USERS） |

**排错记录：** 登录 Configuration 错误 → 根因是 Vercel 环境变量 Key 名与代码 `process.env` 不匹配（`SECRET_KEY` ≠ `AUTH_SECRET` 等），改名 + 补 `AUTH_URL` 后修复。

## v2.2 (2026-06-28) — 星座星图优化

| 文件 | 改动 |
|------|------|
| `src/components/BlackHole.jsx` | 星点亮度 w .85→.35，连线亮度 lc .5→.22，高斯扩散 .00008→.000022 |
| `src/app/globals.css` | 星座热区 22vmin→14vmin，修正四角 CSS 定位（之前 le/ly/or 位置错乱） |
| `src/app/page.js` | CORNERS 映射修正：cls → 星座 → 面板一一对应 |

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
