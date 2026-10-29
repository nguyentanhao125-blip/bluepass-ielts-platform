import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/session";
import { getStore, saveStoreToDisk } from "@/lib/store";
import { notifyNewUserToTelegram } from "@/lib/telegram";
import { UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const store = getStore();
    const body = await req.json();
    const { email, otpCode }: { email: string; otpCode: string } = body;

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ Email và mã xác thực OTP 6 số." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const pending = store.pendingRegistrations[normalizedEmail];

    if (!pending) {
      return NextResponse.json(
        {
          error:
            "Không tìm thấy yêu cầu đăng ký chờ xác thực cho Email này. Vui lòng đăng ký lại.",
        },
        { status: 404 }
      );
    }

    if (Date.now() > pending.expiresAt) {
      delete store.pendingRegistrations[normalizedEmail];
      return NextResponse.json(
        { error: "Mã xác thực OTP đã hết hạn (quá 10 phút). Vui lòng gửi lại." },
        { status: 410 }
      );
    }

    if (pending.otpCode !== otpCode.trim()) {
      return NextResponse.json(
        {
          error:
            "Mã xác thực OTP không chính xác! Nếu bạn nhập Gmail ảo không có thật, bạn sẽ không thể nhận mã kích hoạt.",
        },
        { status: 401 }
      );
    }

    // OTP Verified! Create the official STUDENT account
    const randomCode = Math.floor(1100 + Math.random() * 8800);
    const studentCode = `HV-2026-${randomCode}`;

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      fullName: pending.fullName,
      studentCode,
      phone: pending.phone,
      targetBand: pending.targetBand,
      currentLevel: "Đã xác thực Gmail (Chưa xếp lớp)",
      role: "STUDENT", // Strictly STUDENT role for all self-registrations!
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    store.passwordHashes[normalizedEmail] = pending.passwordHash;
    delete store.pendingRegistrations[normalizedEmail];

    // Log IP registration count to prevent 10 fake accounts from 1 IP
    if (!store.ipRegistrationLog[pending.clientIp]) {
      store.ipRegistrationLog[pending.clientIp] = [];
    }
    store.ipRegistrationLog[pending.clientIp].push(Date.now());

    saveStoreToDisk(store);

    notifyNewUserToTelegram({
      fullName: newUser.fullName,
      email: newUser.email,
      studentCode: newUser.studentCode,
      phone: newUser.phone,
      targetBand: newUser.targetBand,
    }).catch(() => {});

    const token = signSessionToken(newUser);
    const res = NextResponse.json({
      success: true,
      message: `Xác thực Gmail thành công! Mã học viên của bạn là ${studentCode}.`,
      user: newUser,
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
      { error: "Lỗi máy chủ khi xác thực mã OTP." },
      { status: 500 }
    );
  }
}
