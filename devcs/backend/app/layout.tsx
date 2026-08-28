import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "devcs backend",
  description: "토스개발자가되 API 서버",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
