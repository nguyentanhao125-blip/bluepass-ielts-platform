"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Pin,
  Search,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AnnouncementItem, PlacementRow } from "@/lib/types";

type PortalTab =
  | "announcements"
  | "profile"
  | "history"
  | "leaderboard"
  | "placement-list";

interface RankedSubmissionRow {
  rank: number;
  attemptId: string;
  studentCode: string;
  fullName: string;
  email: string;
  testTitle: string;
  skill: string;
  rawScore: number;
  totalQuestions: number;
  percentageScore: number;
  bandScore: number;
  timeSpentSeconds: number;
  tabSwitchCount: number;
  suggestedClass: string;
  submittedAt: string;
}

function formatDateDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function StudentPortalContent() {
  const searchParams = useSearchParams();
  const { currentUser, unreadAnnouncementsCount, setUnreadAnnouncementsCount } =
    useApp();

  const [activeTab, setActiveTab] = useState<PortalTab>("announcements");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementItem | null>(null);
  const [rankings, setRankings] = useState<RankedSubmissionRow[]>([]);
  const [placementSearch, setPlacementSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qTab = searchParams.get("tab") as PortalTab | null;
    if (
      qTab &&
      [
        "announcements",
        "profile",
        "history",
        "leaderboard",
        "placement-list",
      ].includes(qTab)
    ) {
      setActiveTab(qTab);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadPortalData() {
      setLoading(true);
      try {
        const [annRes, rankRes] = await Promise.all([
          fetch("/api/announcements"),
          fetch("/api/admin/rankings"),
        ]);

        if (annRes.ok) {
          const annData = await annRes.json();
          setAnnouncements(annData.announcements || []);
        }

        if (rankRes.ok) {
          const rankData = await rankRes.json();
          setRankings(rankData.rankings || []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPortalData();
  }, []);

  const handleOpenAnnouncement = (ann: AnnouncementItem) => {
    setSelectedAnnouncement(ann);
    if (ann.isNew) {
      ann.isNew = false;
      setUnreadAnnouncementsCount(Math.max(0, unreadAnnouncementsCount - 1));
    }
  };

  // Aggregate all placement rows from published PLACEMENT_RESULT announcements
  const allPlacementRows: PlacementRow[] =
    announcements.find((a) => a.placementData && a.placementData.length > 0)
      ?.placementData || [];

  const filteredPlacementRows = allPlacementRows.filter(
    (r) =>
      !placementSearch ||
      r.fullName.toLowerCase().includes(placementSearch.toLowerCase()) ||
      r.studentCode.toLowerCase().includes(placementSearch.toLowerCase()) ||
      r.assignedClass.toLowerCase().includes(placementSearch.toLowerCase())
  );

  const userHistoryRows = rankings.filter(
    (r) =>
      r.studentCode === currentUser.studentCode ||
      r.email.toLowerCase() === currentUser.email.toLowerCase()
  );

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-6">
      {/* Top Portal Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-6 py-4 text-white shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Cổng Thông Tin Học Viên & Khảo Thí (UEH Portal Standard)
          </p>
          <h1 className="text-lg sm:text-xl font-extrabold">
            Xin chào, {currentUser.fullName} — Mã Học Viên:{" "}
            <span className="underline decoration-amber-300">
              {currentUser.studentCode}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {currentUser.role === "ADMIN" || currentUser.role === "STAFF" ? (
            <Link
              href="/admin?tab=publish"
              className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-900 shadow-xs hover:bg-amber-300 transition"
            >
              + Soạn & Đăng Thông Báo Xếp Lớp (Admin)
            </Link>
          ) : (
            <Link
              href="/exam/test-placement-2026"
              className="rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-[#1d4ed8] shadow-xs hover:bg-sky-50 transition"
            >
              Làm bài Thi Xếp Lớp Đầu Vào →
            </Link>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* UEH STUDENT PORTAL TWO-COLUMN LAYOUT                                */}
      {/* =================================================================== */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDEBAR: "Trang cá nhân" & "Tra cứu thông tin" */}
        <aside className="w-full lg:w-[270px] shrink-0 space-y-4">
          {/* Group 1: Trang cá nhân */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="bg-[#1d4ed8] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-white">
              Trang cá nhân
            </div>
            <div className="divide-y divide-slate-100 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setSelectedAnnouncement(null);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                  activeTab === "profile"
                    ? "bg-[#eff6ff] text-[#0284c7] font-bold border-l-4 border-[#0284c7]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-[#0284c7]" />
                  Thông tin cá nhân
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("announcements");
                  setSelectedAnnouncement(null);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                  activeTab === "announcements"
                    ? "bg-[#eff6ff] text-[#0284c7] font-bold border-l-4 border-[#0284c7]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="h-4 w-4 text-[#0284c7]" />
                  Thông báo
                </span>
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                  {unreadAnnouncementsCount}
                </span>
              </button>
            </div>
          </div>

          {/* Group 2: Tra cứu thông tin */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="bg-[#0284c7] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-white">
              Tra cứu thông tin
            </div>
            <div className="divide-y divide-slate-100 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab("history");
                  setSelectedAnnouncement(null);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                  activeTab === "history"
                    ? "bg-[#eff6ff] text-[#0284c7] font-bold border-l-4 border-[#0284c7]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <History className="h-4 w-4 text-[#0284c7]" />
                  Lịch sử & Kết quả thi
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {userHistoryRows.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("leaderboard");
                  setSelectedAnnouncement(null);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                  activeTab === "leaderboard"
                    ? "bg-[#eff6ff] text-[#0284c7] font-bold border-l-4 border-[#0284c7]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Bảng xếp hạng
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("placement-list");
                  setSelectedAnnouncement(null);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                  activeTab === "placement-list"
                    ? "bg-[#eff6ff] text-[#0284c7] font-bold border-l-4 border-[#0284c7]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-[#1d4ed8]" />
                  Danh sách xếp lớp
                </span>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Chính thức
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* ================================================================= */}
        {/* RIGHT MAIN AREA (UEH "THÔNG BÁO CHUNG" TABLE & SUB-VIEWS)         */}
        {/* ================================================================= */}
        <div className="flex-1 min-w-0">
          {/* 1. TAB: THÔNG BÁO CHUNG (UEH Style Table: Tiêu đề | Người gửi | Thời gian gửi) */}
          {activeTab === "announcements" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-[#eff6ff] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#1d4ed8]" />
                  <h2 className="text-base font-extrabold text-[#1d4ed8] uppercase tracking-wide">
                    Thông báo chung
                  </h2>
                </div>
                {selectedAnnouncement && (
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-[#0284c7] border border-sky-200 hover:bg-sky-50"
                  >
                    ← Quay lại danh sách thông báo
                  </button>
                )}
              </div>

              {selectedAnnouncement ? (
                /* Detailed Announcement View with Official Class Placement Table */
                <div className="p-6 space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="rounded-md bg-[#0284c7] px-2.5 py-0.5 text-[11px] font-bold text-white">
                        {selectedAnnouncement.category === "PLACEMENT_RESULT"
                          ? "KẾT QUẢ XẾP LỚP"
                          : selectedAnnouncement.category === "EXAM_NOTICE"
                          ? "QUY CHẾ KHẢO THÍ"
                          : "THÔNG BÁO ĐÀO TẠO"}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Người gửi:{" "}
                        <strong className="text-slate-800">
                          {selectedAnnouncement.senderName}
                        </strong>{" "}
                        • Ngày đăng:{" "}
                        <strong>
                          {formatDateDDMMYYYY(selectedAnnouncement.publishedAt)}
                        </strong>
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {selectedAnnouncement.title}
                    </h3>
                  </div>

                  {/* Rich HTML Content */}
                  <div
                    className="prose max-w-none text-sm text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html: selectedAnnouncement.contentHtml,
                    }}
                  />

                  {/* Attachment Download Box if available */}
                  {selectedAnnouncement.attachmentName && (
                    <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-[#eff6ff] px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="h-5 w-5 text-[#0284c7]" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Tệp đính kèm chính thức:{" "}
                            {selectedAnnouncement.attachmentName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Định dạng bảng tính CSV/Excel chuẩn UTF-8
                          </p>
                        </div>
                      </div>
                      <a
                        href={
                          selectedAnnouncement.attachmentUrl ||
                          "/api/admin/rankings?format=csv"
                        }
                        className="flex items-center gap-1.5 rounded-xl bg-[#0284c7] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Tải về máy</span>
                      </a>
                    </div>
                  )}

                  {/* Official Class Placement Table inside the Announcement */}
                  {selectedAnnouncement.placementData &&
                    selectedAnnouncement.placementData.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-[#1d4ed8]">
                            📋 BẢNG PHÂN LỚP HỌC VIÊN CHÍNH THỨC (DO ADMIN CÔNG BỐ)
                          </h4>
                          <div className="relative w-64">
                            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={placementSearch}
                              onChange={(e) => setPlacementSearch(e.target.value)}
                              placeholder="Tìm theo Mã HV hoặc Họ tên..."
                              className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:border-[#0284c7] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase">
                              <tr>
                                <th className="px-3.5 py-2.5">Mã HV</th>
                                <th className="px-3.5 py-2.5">Họ và Tên</th>
                                <th className="px-3.5 py-2.5">Điểm Thi</th>
                                <th className="px-3.5 py-2.5">Band</th>
                                <th className="px-3.5 py-2.5">Lớp Xếp Chính Thức</th>
                                <th className="px-3.5 py-2.5">Lịch Học & Phòng</th>
                                <th className="px-3.5 py-2.5">Trạng Thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {selectedAnnouncement.placementData
                                .filter(
                                  (r) =>
                                    !placementSearch ||
                                    r.fullName
                                      .toLowerCase()
                                      .includes(placementSearch.toLowerCase()) ||
                                    r.studentCode
                                      .toLowerCase()
                                      .includes(placementSearch.toLowerCase())
                                )
                                .map((row) => (
                                  <tr
                                    key={row.studentCode}
                                    className={
                                      row.studentCode === currentUser.studentCode
                                        ? "bg-[#eff6ff] font-semibold"
                                        : "hover:bg-slate-50"
                                    }
                                  >
                                    <td className="px-3.5 py-2.5 font-mono font-bold text-[#0284c7]">
                                      {row.studentCode}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-bold text-slate-900">
                                      {row.fullName}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-semibold">
                                      {row.score}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-bold text-[#1d4ed8]">
                                      {row.band}
                                    </td>
                                    <td className="px-3.5 py-2.5 font-bold text-slate-800">
                                      {row.assignedClass}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-slate-600">
                                      {row.schedule} • {row.room}
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      <span
                                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                          row.status === "ĐẠT - XẾP LỚP"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : row.status === "CẦN HỌC BỔ TRỢ"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {row.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                /* UEH Clean Data Table: Tiêu đề | Người gửi | Thời gian gửi (DD/MM/YYYY) */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        <th className="px-5 py-3.5">Tiêu đề</th>
                        <th className="px-4 py-3.5 w-56">Người gửi</th>
                        <th className="px-4 py-3.5 w-36 text-center">
                          Thời gian gửi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-5 py-8 text-center text-slate-500"
                          >
                            Đang tải danh sách thông báo...
                          </td>
                        </tr>
                      ) : (
                        announcements.map((ann) => (
                          <tr
                            key={ann.id}
                            onClick={() => handleOpenAnnouncement(ann)}
                            className="cursor-pointer hover:bg-[#eff6ff]/70 transition group"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-start gap-2">
                                {ann.isPinned && (
                                  <Pin className="mt-0.5 h-4 w-4 shrink-0 text-[#0284c7] fill-[#0284c7]" />
                                )}
                                <div>
                                  <span className="font-bold text-slate-800 group-hover:text-[#0284c7] transition">
                                    {ann.title}
                                  </span>
                                  {ann.isNew && (
                                    <span className="ml-2 inline-block rounded bg-red-500 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                                      MỚI
                                    </span>
                                  )}
                                  {ann.placementData && (
                                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-sky-100 px-2 py-0.2 text-[10px] font-bold text-[#1d4ed8]">
                                      <FileText className="h-3 w-3" />
                                      Đính kèm Bảng Xếp Lớp
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
                              {ann.senderName}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-[#0284c7]" />
                                {formatDateDDMMYYYY(ann.publishedAt)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. TAB: DANH SÁCH XẾP LỚP (Direct Lookup View) */}
          {activeTab === "placement-list" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-[#1d4ed8]">
                    TRA CỨU DANH SÁCH XẾP LỚP CHÍNH THỨC
                  </h2>
                  <p className="text-xs text-slate-500">
                    Được Hội đồng Khảo thí công bố thủ công sau khi rà soát điểm số & chống gian lận
                  </p>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={placementSearch}
                    onChange={(e) => setPlacementSearch(e.target.value)}
                    placeholder="Nhập Mã HV (VD: HV-2026-1042)..."
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-[#0284c7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eff6ff] text-[#1d4ed8] font-extrabold uppercase">
                    <tr>
                      <th className="px-4 py-3">Mã Học Viên</th>
                      <th className="px-4 py-3">Họ và Tên</th>
                      <th className="px-4 py-3">Điểm Xếp Lớp</th>
                      <th className="px-4 py-3">Band</th>
                      <th className="px-4 py-3">Lớp Được Phân</th>
                      <th className="px-4 py-3">Lịch Học & Phòng</th>
                      <th className="px-4 py-3">Kết Quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPlacementRows.map((row) => (
                      <tr
                        key={row.studentCode}
                        className={
                          row.studentCode === currentUser.studentCode
                            ? "bg-sky-50/90 font-semibold"
                            : "hover:bg-slate-50"
                        }
                      >
                        <td className="px-4 py-3 font-mono font-bold text-[#0284c7]">
                          {row.studentCode}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {row.fullName}
                        </td>
                        <td className="px-4 py-3">{row.score}</td>
                        <td className="px-4 py-3 font-bold text-[#1d4ed8]">
                          {row.band}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {row.assignedClass}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.schedule} ({row.room})
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              row.status === "ĐẠT - XẾP LỚP"
                                ? "bg-emerald-100 text-emerald-800"
                                : row.status === "CẦN HỌC BỔ TRỢ"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. TAB: LỊCH SỬ & KẾT QUẢ THI CỦA HỌC VIÊN */}
          {activeTab === "history" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-[#1d4ed8]">
                LỊCH SỬ LÀM BÀI & KẾT QUẢ CHẤM TỰ ĐỘNG CỦA BẠN
              </h2>
              {userHistoryRows.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-xs text-slate-600">
                  Bạn chưa có bài nộp nào. Hãy chọn một đề tại mục{" "}
                  <Link href="/" className="font-bold text-[#0284c7] underline">
                    Luyện đề
                  </Link>{" "}
                  để bắt đầu!
                </div>
              ) : (
                <div className="space-y-3">
                  {userHistoryRows.map((item) => (
                    <div
                      key={item.attemptId}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:border-[#0284c7] transition"
                    >
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {item.testTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Nộp ngày: {formatDateDDMMYYYY(item.submittedAt)} • Thời
                          gian làm: {item.timeSpentSeconds} giây • Chuyển tab:{" "}
                          {item.tabSwitchCount} lần
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-[#0284c7]">
                            {item.rawScore}/{item.totalQuestions} câu đúng (
                            {item.percentageScore}%)
                          </p>
                          <p className="text-xs font-bold text-[#1d4ed8]">
                            Band IELTS: {item.bandScore.toFixed(1)}
                          </p>
                        </div>
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. TAB: BẢNG XẾP HẠNG CÔNG KHAI */}
          {activeTab === "leaderboard" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#1d4ed8]">
                    BẢNG XẾP HẠNG THÀNH TÍCH HỌC VIÊN (CAO XUỐNG THẤP)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sắp xếp theo Điểm cao nhất → Thời gian hoàn thành nhanh nhất → Ít chuyển tab nhất
                  </p>
                </div>
                <Award className="h-7 w-7 text-amber-500" />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eff6ff] text-[#1d4ed8] font-extrabold uppercase">
                    <tr>
                      <th className="px-3.5 py-2.5">Hạng</th>
                      <th className="px-3.5 py-2.5">Mã HV</th>
                      <th className="px-3.5 py-2.5">Họ và Tên</th>
                      <th className="px-3.5 py-2.5">Đề Thi</th>
                      <th className="px-3.5 py-2.5">Điểm Số</th>
                      <th className="px-3.5 py-2.5">Band</th>
                      <th className="px-3.5 py-2.5">Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rankings.map((r) => (
                      <tr key={r.attemptId} className="hover:bg-slate-50">
                        <td className="px-3.5 py-2.5 font-black text-[#0284c7]">
                          #{r.rank}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono font-bold">
                          {r.studentCode}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {r.fullName}
                        </td>
                        <td className="px-3.5 py-2.5 truncate max-w-[220px]">
                          {r.testTitle}
                        </td>
                        <td className="px-3.5 py-2.5 font-extrabold text-[#0284c7]">
                          {r.rawScore}/{r.totalQuestions} ({r.percentageScore}%)
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-[#1d4ed8]">
                          {r.bandScore.toFixed(1)}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600">
                          {r.timeSpentSeconds}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. TAB: THÔNG TIN CÁ NHÂN */}
          {activeTab === "profile" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-[#1d4ed8]">
                HỒ SƠ CÁ NHÂN HỌC VIÊN
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-[#eff6ff] p-4 border border-sky-100">
                  <p className="text-slate-500">Họ và tên</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    {currentUser.fullName}
                  </p>
                </div>
                <div className="rounded-xl bg-[#eff6ff] p-4 border border-sky-100">
                  <p className="text-slate-500">Mã Học Viên (MSSV)</p>
                  <p className="mt-1 text-sm font-mono font-extrabold text-[#0284c7]">
                    {currentUser.studentCode}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-slate-500">Email đăng ký</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {currentUser.email}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-slate-500">Mục tiêu đầu ra & Cấp độ hiện tại</p>
                  <p className="mt-1 text-sm font-bold text-[#1d4ed8]">
                    IELTS {(currentUser.targetBand ?? 7.0).toFixed(1)} •{" "}
                    {currentUser.currentLevel || "IELTS Academic"}
                  </p>
                </div>
                <div className="rounded-xl bg-[#eff6ff] p-4 border border-sky-200 sm:col-span-2">
                  <p className="text-slate-500">Cấp độ Phân quyền Hệ thống (RBAC Role)</p>
                  <p className="mt-1 text-sm font-extrabold text-[#0284c7]">
                    {currentUser.role === "ADMIN"
                      ? "👑 QUẢN TRỊ VIÊN TỐI CAO (ADMIN) — Toàn quyền quản trị đề thi, bảng điểm, thông báo & tài khoản"
                      : currentUser.role === "STAFF"
                      ? "🎧 TƯ VẤN VIÊN / GIÁO VIÊN (STAFF) — Quyền xem điểm, đăng thông báo xếp lớp & hỗ trợ chat học viên"
                      : "🎓 HỌC VIÊN (STUDENT) — Quyền luyện đề, thi xếp lớp, học từ vựng & tra cứu kết quả cá nhân"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm font-semibold text-slate-500">
          Đang tải Cổng Thông Tin Học Viên...
        </div>
      }
    >
      <StudentPortalContent />
    </Suspense>
  );
}
