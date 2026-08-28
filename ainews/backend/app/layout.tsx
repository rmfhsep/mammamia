import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ainews backend",
  description: "IT/AI 아티클 큐레이션 API 서버",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
