"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookMarked,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer inside full-screen computer-delivered exam room
  if (pathname?.startsWith("/exam/")) {
    return null;
  }

  return (
    <footer className="mt-14 border-t border-sky-200/80 bg-gradient-to-b from-[#0f172a] via-[#111c35] to-[#0b1324] text-slate-300">
      {/* Top Academic Seal Strip */}
      <div className="border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 text-xs">
          <div className="flex items-center gap-2.5 text-sky-200 font-semibold">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              Chuẩn khảo thí Computer-Delivered IELTS (Inspera Interface) • Chấm điểm tự động Server-Side 100%
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Giám sát chống gian lận (Anti-Cheat Tab-Track)
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-sky-400" />
              Phân quyền bảo mật RBAC 3 tầng (Admin / Staff / Student)
            </span>
          </div>
        </div>
      </div>

      {/* Main Academic Footer Content */}
      <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-8 px-4 py-10 md:grid-cols-12">
        {/* Column 1: Brand & Academic Mission */}
        <div className="md:col-span-4 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0284c7] to-[#1d4ed8] text-white font-black text-lg shadow-md ring-2 ring-amber-400/40">
              BP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">
                  BluePass
                </span>
                <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                  ACADEMIC EDITION
                </span>
              </div>
              <p className="text-[11px] text-sky-300/80 font-medium">
                Viện Khảo Thí & Đánh Giá Năng Lực Anh Ngữ Học Thuật
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            Hệ thống luyện đề IELTS Reading, Listening, Thi Xếp Lớp Đầu Vào (Placement Test) và Sổ Từ Vựng Học Thuật theo chuẩn Cambridge Assessment English. Toàn bộ đáp án và kết quả được bảo mật và chấm tự động trên máy chủ PostgreSQL 18.
          </p>

          <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-sky-200">
              Cambridge C10–C20
            </span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-sky-200">
              Actual Tests 2026
            </span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-amber-300">
              CEFR B1 – C2
            </span>
          </div>
        </div>

        {/* Column 2: Quick Academic Modules */}
        <div className="md:col-span-3 space-y-2.5 text-xs">
          <h4 className="font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-sky-400" />
            Phân Khu Học Thuật
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <Link
                href="/"
                className="flex items-center gap-2 hover:text-sky-300 transition"
              >
                <BookOpen className="h-3.5 w-3.5 text-sky-400" />
                <span>Ngân hàng đề Reading & Listening</span>
              </Link>
            </li>
            <li>
              <Link
                href="/exam/test-placement-2026"
                className="flex items-center gap-2 hover:text-amber-300 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Đề Thi Xếp Lớp Đầu Vào Chính Thức</span>
              </Link>
            </li>
            <li>
              <Link
                href="/vocab"
                className="flex items-center gap-2 hover:text-sky-300 transition"
              >
                <BookMarked className="h-3.5 w-3.5 text-sky-400" />
                <span>Sổ Từ Vựng Học Thuật (4 Chế độ)</span>
              </Link>
            </li>
            <li>
              <Link
                href="/portal"
                className="flex items-center gap-2 hover:text-sky-300 transition"
              >
                <Award className="h-3.5 w-3.5 text-emerald-400" />
                <span>Cổng Thông Báo Xếp Lớp (UEH Style)</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: IELTS & CEFR Band Equivalency Reference Table */}
        <div className="md:col-span-5 space-y-2.5 text-xs">
          <h4 className="font-extrabold uppercase tracking-wider text-white">
            Bảng Quy Đổi Chuẩn Đầu Ra IELTS & Khung Tham Chiếu Châu Âu (CEFR)
          </h4>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-white/10 bg-white/5 text-sky-200 font-bold">
                <tr>
                  <th className="px-3 py-2">Tỷ lệ đúng</th>
                  <th className="px-3 py-2">Band IELTS</th>
                  <th className="px-3 py-2">Khung CEFR</th>
                  <th className="px-3 py-2">Lớp Xếp Chuẩn Tại BluePass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="px-3 py-1.5 font-mono">85% – 100%</td>
                  <td className="px-3 py-1.5 font-extrabold text-amber-300">
                    Band 7.5 – 9.0
                  </td>
                  <td className="px-3 py-1.5 font-bold text-emerald-400">C1 – C2</td>
                  <td className="px-3 py-1.5">IELTS Master 7.5+ (Lớp C1)</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 font-mono">70% – 84%</td>
                  <td className="px-3 py-1.5 font-extrabold text-sky-300">
                    Band 6.5 – 7.0
                  </td>
                  <td className="px-3 py-1.5 font-bold text-sky-400">B2+</td>
                  <td className="px-3 py-1.5">IELTS Fighter 6.5 (Lớp B2)</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 font-mono">50% – 69%</td>
                  <td className="px-3 py-1.5 font-extrabold text-slate-200">
                    Band 5.0 – 6.0
                  </td>
                  <td className="px-3 py-1.5 font-bold text-amber-400">B1 – B2</td>
                  <td className="px-3 py-1.5">IELTS Intensive 5.5 (Lớp B1)</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 font-mono">&lt; 50%</td>
                  <td className="px-3 py-1.5 font-extrabold text-slate-400">
                    Band 4.0 – 4.5
                  </td>
                  <td className="px-3 py-1.5 font-bold text-rose-400">A2</td>
                  <td className="px-3 py-1.5">IELTS Foundation (Bổ trợ nền tảng)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-white/10 bg-black/20 py-4 text-center text-[11px] text-slate-500">
        © 2026 BluePass IELTS Academic Assessment Platform • Powered by Next.js 14 & PostgreSQL 18.
      </div>
    </footer>
  );
}
