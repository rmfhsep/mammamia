import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 앱인토스 운영/QR 테스트 도메인 + 로컬 개발 주소(mammamia와 동시에 켜둘 때 대비해 5173/5174 둘 다 허용) +
// 개인 확인용 Vercel 프리뷰만 허용합니다.
// (CLAUDE.md 참고: 실서비스 https://<appName>.apps.tossmini.com, QR 테스트 https://<appName>.private-apps.tossmini.com)
const allowedOrigins = [
  "https://devcs.apps.tossmini.com",
  "https://devcs.private-apps.tossmini.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://devcs-web.vercel.app",
];

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin = allowedOrigins.includes(origin);
  const isPreflight = request.method === "OPTIONS";

  if (isPreflight) {
    return NextResponse.json(
      {},
      {
        headers: {
          ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
          ...corsHeaders,
        },
      },
    );
  }

  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
