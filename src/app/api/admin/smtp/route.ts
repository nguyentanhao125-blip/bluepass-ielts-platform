import { NextRequest, NextResponse } from "next/server";
import { getSmtpState, saveSmtpState, sendOtpVerificationEmail } from "@/lib/mailer";

export async function GET() {
  const state = getSmtpState();
  return NextResponse.json({
    smtpUser: state.smtpUser,
    hasPassword: Boolean(state.smtpPass),
    maskedPass: state.smtpPass
      ? `${state.smtpPass.slice(0, 4)} •••• •••• ${state.smtpPass.slice(-4)}`
      : "",
    senderName: state.senderName,
    enabled: state.enabled,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const state = getSmtpState();

    const smtpUser = (body.smtpUser ?? state.smtpUser ?? "nguyentanhao125@gmail.com").trim();
    const smtpPass = (body.smtpPass ?? state.smtpPass ?? "").replace(/\s+/g, "").trim();
    const testRecipient = (body.testRecipient || smtpUser).trim();

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          error:
            "Vui lòng nhập địa chỉ Gmail gửi đi và Mật khẩu ứng dụng 16 ký tự (Google App Password).",
        },
        { status: 400 }
      );
    }

    if (smtpPass.length !== 16) {
      return NextResponse.json(
        {
          error: `Mật khẩu ứng dụng Google (App Password) bắt buộc phải có đúng 16 ký tự chữ cái (bạn vừa nhập ${smtpPass.length} ký tự). Hãy lấy tại myaccount.google.com/apppasswords.`,
        },
        { status: 400 }
      );
    }

    state.smtpUser = smtpUser;
    state.smtpPass = smtpPass;
    state.enabled = true;
    saveSmtpState(state);

    // Send an immediate real OTP verification email to verify SMTP credentials
    const testOtp = String(Math.floor(100000 + Math.random() * 900000));
    const mailRes = await sendOtpVerificationEmail({
      toEmail: testRecipient,
      fullName: "Chủ Hệ Thống BluePass",
      otpCode: testOtp,
    });

    if (!mailRes.sentRealEmail) {
      state.enabled = false;
      saveSmtpState(state);
      return NextResponse.json(
        {
          error:
            mailRes.error ||
            "Không thể gửi thư qua smtp.gmail.com. Hãy kiểm tra lại Mật khẩu ứng dụng 16 ký tự của Google.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Đã kết nối Gmail SMTP thành công và gửi ngay 1 email chứa mã OTP (${testOtp}) tới hộp thư ${testRecipient}! Hãy mở hộp thư Gmail của bạn để kiểm tra!`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi cấu hình SMTP" },
      { status: 500 }
    );
  }
}
