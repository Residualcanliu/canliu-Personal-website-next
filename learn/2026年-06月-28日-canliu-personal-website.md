# 2026-06-28 — canliu-personal-website 开发复盘

## 项目概要

Next.js 16 全栈个人网站，从纯前端视觉站（v2.0）一天内推进到 v2.9：数据库 + OAuth 登录 + admin 后台 + 文章系统 + 访问统计 + 留言板 + 个人面板。

## Errors → Fixes

1. **登录 Configuration 错误** — Auth.js 报 `Configuration` 但没有具体信息。根因是 Vercel 环境变量 Key 名与代码 `process.env` 不匹配：`SECRET_KEY` ≠ `AUTH_SECRET`，`GITHUB_CLIENT_ID` ≠ `AUTH_GITHUB_ID`。改名后修复。教训：环境变量 Key 必须和代码里用的名字完全一致，不能依赖视频教程的命名。

2. **线上 admin 一直 unauthorized** — session 回调里 `session.user.isAdmin` 始终为 false。根因：DrizzleAdapter 创建用户时只填标准字段（id/name/email/image），不填自定义的 `githubUsername`，导致后续查不到。修复：改用 `checkAdmin(userId)` 直查数据库 + `signIn` 回调自动写入 `githubUsername`。

3. **admin 侧边栏变横向** — `globals.css` 的全局 `nav{display:flex;position:fixed;...}` 污染了 admin 侧边栏里的 `<nav>` 标签。修复：在 admin 侧边栏的 `<nav>` 上加显式 reset。

4. **访问统计 "数据查询失败"** — `ORDER BY cnt desc` 别名不认。修复：`orderBy(desc(sql\`cnt\`))` 改成 `orderBy(desc(count()))`。

5. **Neon HTTP driver 的 db.execute() 不可靠** — 改用 Drizzle query builder 或原生 `neon()` SQL 模板。

6. **`git push` 被自动模式拦截** — 因为 `.env.local` 含密钥。修复：只 `git add` 具体文件，不用 `-A`。或用户手动 push。

## Optimizations

1. **星座等比缩放**：之前只缩星点大小，视觉上星座没变小。改用质心等比缩放坐标（60%），星座整体缩小一半。
2. **访问统计并行查询**：6 个 SQL 从串行改 `Promise.all` 并行，页面加载明显加快。
3. **埋点过滤 bot**：UA 黑名单 26 种爬虫 + 过滤 /admin /api /dev 路径，防止统计污染和数据库膨胀。
4. **admin 鉴权直查数据库**：绕开 Auth.js 的 session 回调不确定性，用 `checkAdmin()` 直接读 `githubUsername`。

## 用户思维模式观察

- 动手能力强：自己注册了全部服务（Neon/GitHub OAuth/Cloudflare R2/Vercel/域名），不需要手把手
- 偏好先部署再看效果：本地快速迭代 → push → Vercel 看真实效果 → 继续改
- 对视觉细节敏感：星座大小、热区位置、颜色、字体对齐都亲自动手调
- 功能规划清晰：提前列出 todolist，按优先级逐步推进
- 决策果断：方向对就做，不纠结

## 用户明确的偏好规则

- **禁用 Emoji**（铁律第 4 条）：项目代码和文档中不带彩色表情符号，除非用户要求
- 本地跑完一批再 push，不要每次小改动都推
- 语言用中文
- 风格偏好：功能导向，干净专业，不要花哨

## Patterns to keep

1. 阶段式推进：打地基 → 内容系统 → 增强功能，每阶段完成再进下一步
2. 遇到 bug 先缩小范围：去掉可疑模块（如去掉 DrizzleAdapter 切 JWT），确认问题再修复
3. version.md 记录每次大更新，方便追踪
4. `checkAdmin()` 辅助函数模式：比依赖 session callback 更可靠

## Key takeaways

1. Auth.js v5 DrizzleAdapter 不填自定义字段——鉴权要用数据库直查
2. 全局 CSS 样式名要加作用域，否则会污染无关组件
3. 环境变量名字必须和代码一致，一个字符都不能差
4. Neon HTTP driver 的 SQL 能力有限，优先用 Drizzle query builder
5. 用户自己注册服务的能力很强，不用代劳，只需要代码配合
