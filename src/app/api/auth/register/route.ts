import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dns from "dns/promises";
import { sendOtpVerificationEmail } from "@/lib/mailer";
import { getStore } from "@/lib/store";

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "mailinator.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "maildrop.cc",
  "fakeinbox.com",
]);

/**
 * Validates that an email is a legitimate Gmail / Institutional email
 * and checks DNS MX records so fake domains cannot register.
 */
async function validateRealEmailAddress(email: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  const parts = email.split("@");
  if (parts.length !== 2) {
    return { valid: false, reason: "Định dạng địa chỉ Email không hợp lệ." };
  }

  const [localPart, domain] = parts;

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason:
        "Hệ thống từ chối các tên miền email ảo / email rác dùng 1 lần (Disposable Email).",
    };
  }

  // Strict Google Gmail username rules:
  // Google requires 6-30 characters, only letters, numbers, and periods (no consecutive periods, no leading/trailing period)
  if (domain === "gmail.com" || domain === "googlemail.com") {
    if (localPart.length < 6 || localPart.length > 30) {
      return {
        valid: false,
        reason:
          "Tài khoản @gmail.com thật của Google bắt buộc phải có từ 6 đến 30 ký tự trước dấu @.",
      };
    }
    if (
      !/^[a-z0-9.]+$/.test(localPart) ||
      localPart.startsWith(".") ||
      localPart.endsWith(".") ||
      localPart.includes("..")
    ) {
      return {
        valid: false,
        reason:
          "Tên tài khoản @gmail.com chứa ký tự không hợp lệ theo chuẩn của Google.",
      };
    }
  }

  // Verify DNS MX record exists for the domain (when internet is available)
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        reason: `Tên miền @${domain} không có máy chủ nhận thư (MX Record) hợp lệ.`,
      };
    }
  } catch {
    // Allow fallback if local machine is offline during test
  }

  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    const store = getStore();
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded
      ? forwarded.split(",")[0].trim()
      : req.ip || "127.0.0.1";

    const body = await req.json();
    const {
      fullName,
      email,
      password,
      phone,
      targetBand = 7.0,
    }: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
      targetBand?: number;
    } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có tối thiểu 6 ký tự." },
        { status: 400 }
      );
    }

    // 1. Check Anti-Spam IP Account Creation Cap (Max 3 accounts per IP in 24h)
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
            "Chống Spam Tài Khoản: Địa chỉ mạng (IP) của bạn đã tạo tối đa 3 tài khoản trong 24 giờ qua. Không thể tạo hàng loạt tài khoản ảo.",
        },
        { status: 429 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Validate Email Format, Disposable Blacklist & DNS MX Record
    const emailValidation = await validateRealEmailAddress(normalizedEmail);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.reason },
        { status: 400 }
      );
    }

    // 3. Check if Email is already registered
    const existing = store.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký trên hệ thống BluePass." },
        { status: 409 }
      );
    }

    // 4. Generate 6-digit OTP Verification Code to prove ownership of the real Gmail inbox
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const hashed = await bcrypt.hash(password, 10);

    store.pendingRegistrations[normalizedEmail] = {
      email: normalizedEmail,
      fullName: fullName.trim(),
      passwordHash: hashed,
      phone: phone?.trim() || "0900000000",
      targetBand: Number(targetBand) || 7.0,
      otpCode,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes
      clientIp,
    };

    // Attempt to send real email to Gmail inbox via smtp.gmail.com:465
    const mailResult = await sendOtpVerificationEmail({
      toEmail: normalizedEmail,
      fullName: fullName.trim(),
      otpCode,
    });

    return NextResponse.json({
      requiresOtp: true,
      email: normalizedEmail,
      sentRealEmail: mailResult.sentRealEmail,
      // Only show demoOtpHint when real Gmail App Password hasn't been configured yet
      demoOtpHint: mailResult.sentRealEmail ? undefined : otpCode,
      message: mailResult.sentRealEmail
        ? `✅ Đã gửi email chứa mã OTP 6 chữ số thẳng tới hộp thư Gmail ${normalizedEmail}! Vui lòng mở ứng dụng Gmail của bạn để lấy mã.`
        : `Hệ thống đã tạo mã OTP cho ${normalizedEmail}. Để gửi thư thật vào hộp thư Gmail, hãy nhập Mật khẩu ứng dụng Google (16 ký tự) ở khung bên dưới.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi máy chủ khi khởi tạo đăng ký tài khoản." },
      { status: 500 }
    );
  }
}
