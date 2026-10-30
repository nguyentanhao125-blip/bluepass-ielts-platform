"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  BookMarked,
  BookOpen,
  Flame,
  GraduationCap,
  Home,
  LogIn,
  LogOut,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    logout,
    setIsAuthModalOpen,
    unreadAnnouncementsCount,
  } = useApp();

  // Hide global navbar inside full-screen exam runner for distraction-free focus
  if (pathname?.startsWith("/exam/")) {
    return null;
  }

  const isAdminOrStaff =
    currentUser.role === "ADMIN" || currentUser.role === "STAFF";

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      {/* Row 1: Top Utility Bar */}
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0284c7] to-[#1d4ed8] text-white font-extrabold text-lg shadow-sm">
            BP
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black tracking-tight text-[#0284c7]">
                Blue
              </span>
              <span className="text-xl font-black tracking-tight text-[#1d4ed8]">
                Pass
              </span>
              <span className="ml-1 rounded-md bg-[#eff6ff] px-1.5 py-0.5 text-[10px] font-bold text-[#0284c7] border border-sky-200">
                IELTS & ACADEMIC
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 -mt-1">
              Developed by BluePass Testing Center
            </p>
          </div>
        </Link>

        {/* Center Promotional Ticker */}
        <div className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-600">
          <Link
            href="/?mode=PLACEMENT"
            className="flex items-center gap-1.5 text-[#1d4ed8] hover:underline font-semibold"
          >
            <Search className="h-3.5 w-3.5 text-[#0284c7]" />
            <span>
              Kỳ Thi Xếp Lớp Đầu Vào Khóa Intensive 7.5+ đang mở đăng ký, tìm hiểu ngay!
            </span>
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/vocab"
            className="flex items-center gap-1 hover:text-[#0284c7] transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Cách luyện tập FREE</span>
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/portal"
            className="flex items-center gap-1 hover:text-[#0284c7] transition"
          >
            <Users className="h-3.5 w-3.5 text-[#0284c7]" />
            <span>Tra cứu Danh sách Xếp lớp</span>
          </Link>
        </div>

        {/* Right Actions: Upgrade PRO, Notification Bell, User Profile / Login Button */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/?mode=PLACEMENT"
            className="hidden sm:flex items-center gap-1.5 rounded-full border-2 border-[#0284c7]/30 bg-gradient-to-r from-[#eff6ff] to-sky-100/80 px-3.5 py-1 text-xs font-bold text-[#1d4ed8] hover:border-[#0284c7] transition"
          >
            <span>Thi Xếp Lớp PRO</span>
            <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          </Link>

          {/* Notification Bell with Unread Badge -> UEH Portal */}
          <Link
            href="/portal"
            className="relative rounded-full p-2 text-slate-600 hover:bg-[#eff6ff] hover:text-[#0284c7] transition"
            title="Cổng Thông Báo & Kết Quả Xếp Lớp"
          >
            <Bell className="h-5 w-5" />
            {unreadAnnouncementsCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadAnnouncementsCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill + Login / Switch Account Modal Trigger */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-3 hover:border-[#0284c7] hover:bg-[#eff6ff] transition"
            title="Nhấn để Đăng nhập tài khoản Admin / Giáo viên hoặc Đăng ký Học viên mới"
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                currentUser.role === "ADMIN"
                  ? "bg-amber-500 text-slate-950"
                  : currentUser.role === "STAFF"
                  ? "bg-emerald-600"
                  : "bg-gradient-to-r from-[#0284c7] to-[#1d4ed8]"
              }`}
            >
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.fullName.split(" ").slice(-2).join(" ")}
                </p>
                <span
                  className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase ${
                    currentUser.role === "ADMIN"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : currentUser.role === "STAFF"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-sky-100 text-[#0284c7]"
                  }`}
                >
                  {currentUser.role === "ADMIN"
                    ? "ADMIN"
                    : currentUser.role === "STAFF"
                    ? "NHÂN VIÊN"
                    : "HỌC VIÊN"}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 leading-tight">
                {currentUser.studentCode} • Đổi tài khoản
              </p>
            </div>
            <LogIn className="h-3.5 w-3.5 text-[#0284c7] ml-0.5" />
          </button>

          {(currentUser.role !== "STUDENT" ||
            currentUser.id !== "user-student-1") && (
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 transition"
              title="Đăng xuất về chế độ Học viên mặc định"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Đăng xuất</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Royal/Ocean Blue Primary Navigation Bar (Strict RBAC: Admin tab hidden from Students!) */}
      <nav className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#1d4ed8] text-white shadow-inner">
        <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-4 py-1.5 no-scrollbar text-xs sm:text-sm">
          <Link
            href="/portal?tab=profile"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 font-semibold text-sky-50 hover:bg-white/15 transition"
          >
            <Home className="h-4 w-4" />
            <span>My Homepage</span>
          </Link>

          <span className="text-white/30">|</span>

          <Link
            href="/"
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-1.5 font-bold transition ${
              pathname === "/"
                ? "bg-white text-[#0284c7] shadow-sm"
                : "text-white hover:bg-white/15"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Luyện đề 4 Kỹ năng (Reading & Listening)</span>
          </Link>

          <span className="text-white/30">|</span>

          <Link
            href="/exam/test-placement-2026"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 font-semibold text-white hover:bg-white/15 transition"
          >
            <GraduationCap className="h-4 w-4 text-amber-300" />
            <span>Thi Xếp Lớp Đầu Vào</span>
          </Link>

          <span className="text-white/30">|</span>

          <Link
            href="/vocab"
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 font-semibold transition ${
              pathname?.startsWith("/vocab")
                ? "bg-white text-[#0284c7] shadow-sm font-bold"
                : "text-white hover:bg-white/15"
            }`}
          >
            <BookMarked className="h-4 w-4" />
            <span>Sổ Từ Vựng</span>
          </Link>

          <span className="text-white/30">|</span>

          <Link
            href="/portal"
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 font-semibold transition ${
              pathname?.startsWith("/portal")
                ? "bg-white text-[#0284c7] shadow-sm font-bold"
                : "text-white hover:bg-white/15"
            }`}
          >
            <Award className="h-4 w-4 text-amber-300" />
            <span>Thông báo & Kết quả Xếp lớp</span>
            {unreadAnnouncementsCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-extrabold text-slate-900">
                {unreadAnnouncementsCount} mới
              </span>
            )}
          </Link>

          {/* ONLY SHOW ADMIN / STAFF MENU WHEN LOGGED IN AS ADMIN OR STAFF */}
          {isAdminOrStaff && (
            <>
              <span className="text-white/30">|</span>
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 font-semibold transition ${
                  pathname?.startsWith("/admin")
                    ? "bg-amber-400 text-slate-950 shadow-sm font-black"
                    : "bg-white/15 text-amber-200 hover:bg-white/25"
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>
                  {currentUser.role === "ADMIN"
                    ? "Quản trị Hệ thống & Đăng Đề Thi (Admin)"
                    : "Bàn làm việc Tư vấn & Xếp hạng (Staff)"}
                </span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
