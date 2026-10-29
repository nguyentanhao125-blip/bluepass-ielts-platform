"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, setCurrentUser } = useApp();
  const [tab, setTab] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [targetBand, setTargetBand] = useState("7.0");

  // 2-Step Gmail OTP Verification state
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [showSmtpSetup, setShowSmtpSetup] = useState(false);
  const [smtpSenderEmail, setSmtpSenderEmail] = useState("nguyentanhao125@gmail.com");
  const [smtpAppPass, setSmtpAppPass] = useState("");
  const [smtpSaving, setSmtpSaving] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLoginOrRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === "LOGIN") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Đăng nhập thất bại.");
        } else {
          setCurrentUser(data.user);
          setSuccessMsg(
            `Đăng nhập thành công với vai trò ${data.user.role}: ${data.user.fullName}!`
          );
          setTimeout(() => {
            setIsAuthModalOpen(false);
            setSuccessMsg(null);
          }, 900);
        }
        return;
      }

      // REGISTER STEP 1: Validate Gmail & Send 6-Digit OTP
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone,
          targetBand: Number(targetBand),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể đăng ký tài khoản.");
      } else if (data.requiresOtp) {
        setAwaitingOtp(true);
        setDemoOtpHint(data.demoOtpHint || null);
        setSuccessMsg(data.message);
      }
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // REGISTER STEP 2: Verify 6-Digit OTP Code from Gmail
  const handleVerifyOtpStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otpCode: otpInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Mã xác thực OTP không hợp lệ.");
      } else {
        setCurrentUser(data.user);
        setSuccessMsg(data.message);
        setAwaitingOtp(false);
        setOtpInput("");
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setSuccessMsg(null);
        }, 1200);
      }
    } catch {
      setError("Lỗi kết nối khi xác thực OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateRealGmailSmtp = async () => {
    setError(null);
    setSmtpSaving(true);
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpUser: smtpSenderEmail,
          smtpPass: smtpAppPass,
          testRecipient: email || smtpSenderEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể kết nối SMTP Gmail.");
      } else {
        setDemoOtpHint(null);
        setShowSmtpSetup(false);
        setSuccessMsg(data.message);
      }
    } catch {
      setError("Lỗi kết nối khi lưu cấu hình Gmail SMTP.");
    } finally {
      setSmtpSaving(false);
    }
  };

  const quickLoginPreset = async (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("123456");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: presetEmail, password: "123456" }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        setSuccessMsg(
          `Đã chuyển sang tài khoản ${data.user.role}: ${data.user.fullName}`
        );
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setSuccessMsg(null);
        }, 700);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-sky-100">
        {/* Royal Blue Header */}
        <div className="bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-6 py-5 text-white">
          <button
            onClick={() => {
              setIsAuthModalOpen(false);
              setAwaitingOtp(false);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 text-white hover:bg-white/25 transition"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-100">
            <ShieldCheck className="h-4 w-4" />
            Phân Quyền Bảo Mật & Xác Thực Gmail OTP
          </div>
          <h3 className="mt-1 text-xl font-bold">
            {awaitingOtp
              ? "Xác Thực Mã OTP 6 Số Gửi Tới Gmail"
              : tab === "LOGIN"
              ? "Đăng Nhập Hệ Thống BluePass"
              : "Đăng Ký Học Viên (Bảo Vệ Chống Gmail Ảo)"}
          </h3>
          <p className="mt-1 text-xs text-sky-100">
            Chống tạo tài khoản rác: Kiểm tra MX Google, giới hạn 3 tài khoản/IP & bắt buộc xác thực OTP
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        {!awaitingOtp && (
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setTab("LOGIN");
                setError(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                tab === "LOGIN"
                  ? "bg-white text-[#0284c7] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Đăng nhập (Admin / Học viên)
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("REGISTER");
                setError(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                tab === "REGISTER"
                  ? "bg-white text-[#0284c7] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Đăng ký Học viên mới
            </button>
          </div>
        )}

        {awaitingOtp ? (
          /* STEP 2: 6-DIGIT OTP VERIFICATION FORM */
          <form onSubmit={handleVerifyOtpStep2} className="space-y-4 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="rounded-xl border border-sky-200 bg-[#eff6ff] px-3.5 py-2.5 text-xs font-medium text-[#1d4ed8]">
                {successMsg}
              </div>
            )}

            {demoOtpHint && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold">
                    🔑 Mã OTP tạm thời (Khi chưa gắn Mật khẩu ứng dụng Gmail):
                  </p>
                  <span className="font-mono text-base font-black tracking-widest text-[#1d4ed8]">
                    {demoOtpHint}
                  </span>
                </div>

                {!showSmtpSetup ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (email.endsWith("@gmail.com")) {
                        setSmtpSenderEmail(email);
                      }
                      setShowSmtpSetup(true);
                    }}
                    className="w-full rounded-lg bg-[#0284c7] px-3 py-2 text-center text-[11px] font-extrabold text-white shadow-xs hover:bg-[#1d4ed8] transition"
                  >
                    📧 Bấm vào đây để kết nối Gmail gửi thư OTP thật về hộp thư của bạn
                  </button>
                ) : (
                  <div className="rounded-lg border border-sky-200 bg-white p-3 space-y-2.5 text-slate-700">
                    <div className="font-extrabold text-[#1d4ed8]">
                      ⚡ Kích hoạt gửi Email OTP thật qua Google SMTP (30 giây):
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                      <li>
                        Bấm mở trang chính thức của Google:{" "}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#0284c7] underline"
                        >
                          myaccount.google.com/apppasswords
                        </a>
                      </li>
                      <li>
                        Gõ tên ứng dụng bất kỳ (VD: <code className="font-bold">BluePass</code>) rồi nhấn <strong>Tạo (Create)</strong>.
                      </li>
                      <li>
                        Copy <strong>16 chữ cái mật khẩu ứng dụng</strong> Google hiện ra trên màn hình vàng và dán vào ô dưới đây:
                      </li>
                    </ol>
                    <input
                      type="email"
                      value={smtpSenderEmail}
                      onChange={(e) => setSmtpSenderEmail(e.target.value)}
                      placeholder="Gmail dùng để gửi thư (VD: nguyentanhao125@gmail.com)"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={smtpAppPass}
                      onChange={(e) => setSmtpAppPass(e.target.value)}
                      placeholder="Dán 16 ký tự Google App Password (VD: abcd efgh ijkl mnop)"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSmtpSetup(false)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        disabled={smtpSaving}
                        onClick={handleActivateRealGmailSmtp}
                        className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {smtpSaving
                          ? "Đang kết nối smtp.gmail.com..."
                          : "✅ Lưu & Gửi Ngay Thư OTP Thật Tới Gmail"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Nhập mã OTP 6 chữ số đã gửi tới {email} *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-[#0284c7]" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Nhập 6 chữ số (VD: 482910)"
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-center font-mono text-base font-black tracking-widest text-[#1d4ed8] focus:border-[#0284c7] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAwaitingOtp(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] py-2.5 text-xs font-extrabold text-white shadow-md"
              >
                {loading
                  ? "Đang kiểm tra OTP..."
                  : "Xác Nhận Mã OTP & Kích Hoạt Tài Khoản"}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: LOGIN OR REGISTER FORM */
          <form onSubmit={handleLoginOrRegisterStep1} className="space-y-4 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}

            {tab === "REGISTER" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Họ và tên học viên *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Khôi"
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#0284c7] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Địa chỉ Gmail / Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hocvien2026@gmail.com (Từ 6-30 ký tự trước @)"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#0284c7] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Mật khẩu bảo mật *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự (Tài khoản mẫu: 123456)"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#0284c7] focus:outline-none"
                />
              </div>
            </div>

            {tab === "REGISTER" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 xxx xxx"
                      className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#0284c7] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Mục tiêu IELTS
                  </label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-sky-500" />
                    <select
                      value={targetBand}
                      onChange={(e) => setTargetBand(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#0284c7] focus:outline-none bg-white"
                    >
                      <option value="6.0">Band 6.0+</option>
                      <option value="6.5">Band 6.5+</option>
                      <option value="7.0">Band 7.0+</option>
                      <option value="7.5">Band 7.5+</option>
                      <option value="8.0">Band 8.0+</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-50"
            >
              {loading
                ? "Đang xử lý bảo mật..."
                : tab === "REGISTER"
                ? "Gửi Mã Xác Thực OTP Tới Gmail"
                : "Đăng nhập ngay"}
            </button>

            {/* Quick 1-Click Account Login for Owner Testing */}
            <div className="rounded-xl bg-[#eff6ff] p-3 text-xs text-slate-600 border border-sky-200 space-y-2">
              <p className="font-bold text-[#1d4ed8]">
                ⚡ Chọn nhanh tài khoản đã tạo sẵn cho bạn (1-Click Login):
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => quickLoginPreset("admin@bluepass.edu.vn")}
                  className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-left text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition"
                >
                  <span>👑 Chủ Web / Admin (Đăng & Xóa đề, Xuất Excel)</span>
                  <code className="font-mono">admin@bluepass.edu.vn</code>
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginPreset("tuvan@bluepass.edu.vn")}
                  className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-left text-[11px] font-bold text-emerald-900 hover:bg-emerald-100 transition"
                >
                  <span>🎧 Nhân viên Tư vấn (Trực Chat & Xếp hạng)</span>
                  <code className="font-mono">tuvan@bluepass.edu.vn</code>
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginPreset("hocvien@bluepass.edu.vn")}
                  className="flex items-center justify-between rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-left text-[11px] font-bold text-[#0284c7] hover:bg-sky-50 transition"
                >
                  <span>🎓 Học viên (Chỉ được làm bài, bị chặn trang Admin)</span>
                  <code className="font-mono">hocvien@bluepass.edu.vn</code>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
