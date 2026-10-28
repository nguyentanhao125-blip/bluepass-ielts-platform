import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Extract client IP for rate limiting on VPS behind reverse proxy / Docker
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : req.ip || "127.0.0.1";

  // 1. Strict Rate Limiting on Auth Endpoints (Login & Register)
  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/register")) {
    const rl = checkRateLimit(`auth:${clientIp}:${pathname}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error:
            "Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau ít phút để bảo vệ tài khoản.",
          retryAfterSeconds: rl.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(rl.resetInSeconds),
          },
        }
      );
    }
  }

  // 2. Strict Rate Limiting on Exam Submission Endpoint (Anti-Spam / Race Protection)
  if (pathname.includes("/api/tests/") && pathname.endsWith("/submit") && req.method === "POST") {
    const rl = checkRateLimit(`submit:${clientIp}`, 8, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Hệ thống đang xử lý bài nộp của bạn. Vui lòng không nhấn nộp bài liên tục.",
          retryAfterSeconds: rl.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(rl.resetInSeconds),
          },
        }
      );
    }
  }

  // 3. Rate Limiting on Chat Endpoint
  if (pathname.startsWith("/api/chat") && req.method === "POST") {
    const rl = checkRateLimit(`chat:${clientIp}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi vài giây.",
          retryAfterSeconds: rl.resetInSeconds,
        },
        { status: 429 }
      );
    }
  }

  // Security headers for production VPS deployment
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
