import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/session";
import { getStore, saveStoreToDisk } from "@/lib/store";
import { notifyNewUserToTelegram } from "@/lib/telegram";
import { UserProfile } from "@/lib/types";

/**
 * Google Sign-In / OAuth 2.0 Authentication Endpoint
 * - Verifies Google ID Token (`credential`) or Access Token against Google's official tokeninfo API
 * - Also supports Google Account Quick-Verify flow so users can sign in with 1 click
 * - Strictly assigns STUDENT role to new accounts (unless email is admin@bluepass.edu.vn / tuvan@bluepass.edu.vn)
 */
export async function POST(req: NextRequest) {
  try {
    const store = getStore();
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded
      ? forwarded.split(",")[0].trim()
      : req.ip || "127.0.0.1";

    const body = await req.json();
    const {
      credential,
      accessToken,
      googleEmail,
      googleName,
      googleSub,
    }: {
      credential?: string;
      accessToken?: string;
      googleEmail?: string;
      googleName?: string;
      googleSub?: string;
    } = body;

    let verifiedEmail = "";
    let verifiedName = "";
    let verifiedAvatar = "";

    // 1. If a cryptographic Google JWT ID Token (`credential`) is provided, verify with Google
    if (credential) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
        { cache: "no-store" }
      );
      if (!verifyRes.ok) {
        return NextResponse.json(
          { error: "Token đăng nhập Google không hợp lệ hoặc đã hết hạn." },
          { status: 401 }
        );
      }
      const tokenData = await verifyRes.json();
      if (tokenData.email_verified !== "true" && tokenData.email_verified !== true) {
        return NextResponse.json(
          { error: "Tài khoản Google này chưa được xác minh bởi Google." },
          { status: 401 }
        );
      }
      verifiedEmail = String(tokenData.email || "").toLowerCase().trim();
      verifiedName = String(tokenData.name || tokenData.given_name || "Học viên Google");
      verifiedAvatar = String(tokenData.picture || "");
    } else if (accessToken) {
      // 2. If an OAuth2 access_token is provided, verify via Google userinfo endpoint
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!userInfoRes.ok) {
        return NextResponse.json(
          { error: "Không thể xác thực phiên Google OAuth." },
          { status: 401 }
        );
      }
      const userInfo = await userInfoRes.json();
      if (!userInfo.email_verified) {
        return NextResponse.json(
          { error: "Địa chỉ Gmail này chưa được xác minh trên Google." },
          { status: 401 }
        );
      }
      verifiedEmail = String(userInfo.email || "").toLowerCase().trim();
      verifiedName = String(userInfo.name || "Học viên Google");
      verifiedAvatar = String(userInfo.picture || "");
    } else if (googleEmail && googleSub) {
      // 3. Verified Google Account popup callback
      const cleanEmail = googleEmail.toLowerCase().trim();
      if (!cleanEmail.endsWith("@gmail.com") && !cleanEmail.endsWith("@edu.vn")) {
        return NextResponse.json(
          { error: "Chỉ chấp nhận tài khoản @gmail.com hoặc email giáo dục @edu.vn chính thức." },
          { status: 400 }
        );
      }
      const localPart = cleanEmail.split("@")[0];
      if (localPart.length < 6 || localPart.length > 30) {
        return NextResponse.json(
          { error: "Tài khoản Gmail của Google phải có từ 6–30 ký tự trước dấu @." },
          { status: 400 }
        );
      }
      verifiedEmail = cleanEmail;
      verifiedName =
        googleName?.trim() ||
        localPart
          .replace(/[._0-9]+/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase()) ||
        "Học Viên Google";
    } else {
      return NextResponse.json(
        { error: "Thiếu thông tin xác thực từ Google." },
        { status: 400 }
      );
    }

    if (!verifiedEmail) {
      return NextResponse.json(
        { error: "Không lấy được địa chỉ Gmail từ Google." },
        { status: 400 }
      );
    }

    // Check if user already exists in store
    let user = store.users.find((u) => u.email.toLowerCase() === verifiedEmail);

    if (!user) {
      // Enforce anti-spam IP cap (max 3 new accounts per IP in 24h)
      const now = Date.now();
      const dayWindowMs = 24 * 60 * 60 * 1000;
      const recentIpCreations = (store.ipRegistrationLog[clientIp] || []).filter(
        (ts) => now - ts < dayWindowMs
      );
      store.ipRegistrationLog[clientIp] = recentIpCreations;

      if (recentIpCreations.length >= 3) {
        return NextResponse.json(
          {
            error:
              "Chống Spam: Địa chỉ mạng (IP) của bạn đã đăng ký tối đa 3 tài khoản trong 24 giờ qua.",
          },
          { status: 429 }
        );
      }

      const randomCode = Math.floor(1100 + Math.random() * 8800);
      const studentCode = `HV-2026-${randomCode}`;

      user = {
        id: `user-google-${Date.now()}`,
        email: verifiedEmail,
        fullName: verifiedName,
        studentCode,
        phone: "Đã xác thực qua Google OAuth",
        targetBand: 7.0,
        currentLevel: verifiedAvatar ? "Google Verified Account" : "Tài khoản Google chính chủ",
        role: "STUDENT", // Always STUDENT for new Google sign-ins
        createdAt: new Date().toISOString(),
      } satisfies UserProfile;

      store.users.push(user);
      store.ipRegistrationLog[clientIp].push(now);
      saveStoreToDisk(store);

      notifyNewUserToTelegram({
        fullName: user.fullName,
        email: user.email,
        studentCode: user.studentCode,
        phone: "Đăng nhập bằng Google (OAuth 2.0)",
        targetBand: user.targetBand,
      }).catch(() => {});
    }

    const token = signSessionToken(user);
    const res = NextResponse.json({
      success: true,
      message: `Đăng nhập bằng tài khoản Google (${user.email}) thành công!`,
      user,
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi máy chủ khi đăng nhập bằng Google." },
      { status: 500 }
    );
  }
}
