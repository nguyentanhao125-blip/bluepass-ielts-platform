import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/session";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const store = getStore();
    const body = await req.json();
    const { email, password }: { email: string; password?: string } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ Email." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = store.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Tài khoản không tồn tại hoặc chưa xác thực OTP Gmail. Vui lòng đăng ký trước!",
        },
        { status: 401 }
      );
    }

    const storedSecret = store.passwordHashes[normalizedEmail];
    // Strictly require password for ADMIN, STAFF, or any account with a stored password hash
    if (storedSecret || user.role === "ADMIN" || user.role === "STAFF") {
      if (!password) {
        return NextResponse.json(
          { error: "Vui lòng nhập mật khẩu để đăng nhập tài khoản này." },
          { status: 401 }
        );
      }
      const effectiveSecret = storedSecret || "123456";
      const isBcrypt = effectiveSecret.startsWith("$2");
      const valid = isBcrypt
        ? await bcrypt.compare(password, effectiveSecret)
        : password === effectiveSecret;

      if (!valid) {
        return NextResponse.json(
          { error: "Mật khẩu không chính xác." },
          { status: 401 }
        );
      }
    }

    const token = signSessionToken(user);
    const res = NextResponse.json({
      success: true,
      user,
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Lỗi máy chủ khi đăng nhập." },
      { status: 500 }
    );
  }
}
