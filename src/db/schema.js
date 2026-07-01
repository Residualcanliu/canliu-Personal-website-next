import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

/* ---- Auth.js 认证表 ---- */

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  isAdmin: integer("isAdmin").default(0),
  githubUsername: text("githubUsername"),
});

export const accounts = pgTable("account", {
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/* ---- 文章表 ---- */
export const articles = pgTable("article", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").default(""),
  excerpt: text("excerpt").default(""),
  coverImage: text("coverImage"),
  published: integer("published").default(0),
  allowComments: integer("allowComments").default(1),  // 1=允许评论 0=关闭
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

/* ---- 文章评论 ---- */
export const comments = pgTable("comment", {
  id: text("id").primaryKey(),
  articleId: text("articleId").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  ip: text("ip"),
  approved: integer("approved").default(0),   // 0=待审 1=通过 -1=拒绝
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ---- 访问日志 ---- */
export const visitLogs = pgTable("visitLog", {
  id: text("id").primaryKey(),
  path: text("path").notNull(),
  ip: text("ip"),
  ua: text("ua"),
  referer: text("referer"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ---- 留言板 ---- */
export const messages = pgTable("message", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  msgStatus: text("msgStatus").default(""),   // 留言者自己的状态
  approved: integer("approved").default(0),   // 0=待审 1=通过 -1=拒绝
  ip: text("ip"),                              // 提交者 IP，用于频率限制
  reply: text("reply"),                        // 回复内容
  replyIp: text("replyIp"),                    // 回复者 IP，用于频率限制
  replyAt: timestamp("replyAt", { mode: "date" }),  // 回复时间
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ---- 项目表 ---- */
export const projects = pgTable("project", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").default(""),       // Markdown 内容
  tags: text("tags").default(""),             // 逗号分隔标签
  link: text("link"),                         // 项目链接
  published: integer("published").default(0), // 0=草稿 1=发布
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

/* ---- 音乐表 ---- */
export const songs = pgTable("song", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").default(""),
  url: text("url").notNull(),           // 音频 URL 或文件路径
  cover: text("cover"),                 // 封面图（可选）
  published: integer("published").default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ---- 游戏排行榜 ---- */
export const gameScores = pgTable("gameScore", {
  id: text("id").primaryKey(),
  mode: text("mode").notNull(),          // "timed" / "lives" / "abyss"
  score: integer("score").notNull(),
  playerName: text("playerName").default("匿名"),
  config: text("config"),                // abyss 模式参数 JSON
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

/* ---- 站点设置（键值对） ---- */
export const settings = pgTable("setting", {
  key: text("key").primaryKey(),
  value: text("value").default(""),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});
