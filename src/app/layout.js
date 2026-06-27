import "./globals.css";

export const metadata = {
  title: "个人空间 — canliu",
  description: "canliu 个人网站",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
