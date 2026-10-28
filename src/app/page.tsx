"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Filter,
  GraduationCap,
  Headphones,
  HelpCircle,
  MessageSquarePlus,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Skill, TestMode, TestSource } from "@/lib/types";

interface TestCardSummary {
  id: string;
  slug: string;
  title: string;
  description?: string;
  skill: Skill;
  mode: TestMode;
  passageNumber: number | null;
  source: TestSource;
  durationMinutes: number;
  totalQuestions: number;
  thumbnailUrl: string;
  attemptCount: number;
  questionTypesSummary: string[];
  isPlacement: boolean;
  isCompletedByUser: boolean;
}

const SOURCE_OPTIONS: { value: TestSource; label: string }[] = [
  { value: "PRO_PACKAGE", label: "Gói Luyện đề PRO" },
  { value: "SIMULATION", label: "BluePass Simulation" },
  { value: "COLLECT_REAL", label: "BluePass Collect đề thi" },
  { value: "CAMBRIDGE_C10_C20", label: "C10-C20" },
  { value: "ACTUAL_TESTS", label: "Actual Tests" },
  { value: "OTHER", label: "Các nguồn khác" },
];

const QUESTION_TYPE_LABELS: string[] = [
  "Matching Headings",
  "True - False - Not Given",
  "Yes - No - Not Given",
  "Multiple Choice (One Answer)",
  "Matching Information",
  "Matching Features",
  "Multiple Choice (Many Answers)",
  "Map, Diagram Label",
  "Gap Filling",
];

function PracticeBankContent() {
  const searchParams = useSearchParams();
  const { currentUser } = useApp();

  const [tests, setTests] = useState<TestCardSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States (Replicating Left Sidebar & Top Tabs from YouPass Screenshots)
  const [selectedSkill, setSelectedSkill] = useState<Skill | "ALL">("READING");
  const [selectedMode, setSelectedMode] = useState<TestMode | "ALL">("SINGLE_PASSAGE");
  const [selectedPassage, setSelectedPassage] = useState<number | null>(null);
  const [selectedSources, setSelectedSources] = useState<TestSource[]>([]);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const [completionTab, setCompletionTab] = useState<"UNCOMPLETED" | "COMPLETED">(
    "UNCOMPLETED"
  );
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Sidebar section collapse states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(true);
  const [qTypeOpen, setQTypeOpen] = useState(true);

  // Sync URL query `?mode=PLACEMENT` if clicked from Navbar
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "PLACEMENT") {
      setSelectedSkill("ALL");
      setSelectedMode("PLACEMENT");
      setSelectedPassage(null);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadTests() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tests?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setTests(data.tests || []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadTests();
  }, [currentUser.id]);

  const toggleSource = (src: TestSource) => {
    setSelectedSources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  const toggleQuestionType = (qt: string) => {
    setSelectedQuestionTypes((prev) =>
      prev.includes(qt) ? prev.filter((q) => q !== qt) : [...prev, qt]
    );
  };

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (selectedMode === "PLACEMENT") {
        if (!t.isPlacement) return false;
      } else {
        if (selectedSkill !== "ALL" && t.skill !== selectedSkill) return false;
        if (selectedMode !== "ALL" && t.mode !== selectedMode && !t.isPlacement) {
          return false;
        }
        if (selectedPassage !== null && t.passageNumber !== selectedPassage) {
          return false;
        }
      }

      if (
        selectedSources.length > 0 &&
        !selectedSources.includes(t.source)
      ) {
        return false;
      }

      if (
        selectedQuestionTypes.length > 0 &&
        !selectedQuestionTypes.some((qt) => t.questionTypesSummary.includes(qt))
      ) {
        return false;
      }

      if (completionTab === "COMPLETED" && !t.isCompletedByUser) return false;
      if (completionTab === "UNCOMPLETED" && t.isCompletedByUser) return false;

      if (appliedSearch) {
        const q = appliedSearch.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !(t.description || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    tests,
    selectedSkill,
    selectedMode,
    selectedPassage,
    selectedSources,
    selectedQuestionTypes,
    completionTab,
    appliedSearch,
  ]);

  const resetAllFilters = () => {
    setSelectedSkill("ALL");
    setSelectedMode("ALL");
    setSelectedPassage(null);
    setSelectedSources([]);
    setSelectedQuestionTypes([]);
    setSearchInput("");
    setAppliedSearch("");
    setCompletionTab("UNCOMPLETED");
  };

  const getBadgeStyle = (test: TestCardSummary) => {
    if (test.isPlacement) {
      return {
        label: "Thi Xếp Lớp",
        className: "bg-emerald-600 text-white",
      };
    }
    if (test.mode === "FULL_TEST") {
      return {
        label: "Full đề",
        className: "bg-[#1d4ed8] text-white",
      };
    }
    if (test.skill === "LISTENING") {
      return {
        label: `Part ${test.passageNumber || 1}`,
        className: "bg-[#0284c7] text-white",
      };
    }
    if (test.passageNumber === 1) {
      return {
        label: "Passage 1",
        className: "bg-amber-500 text-white",
      };
    }
    if (test.passageNumber === 2) {
      return {
        label: "Passage 2",
        className: "bg-indigo-500 text-white",
      };
    }
    return {
      label: `Passage ${test.passageNumber || 3}`,
      className: "bg-purple-500 text-white",
    };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sub-Navigation Skill Tabs (Replicating Reading | Listening | Thi Xếp Lớp Bar under Primary Navbar) */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1360px] items-center justify-center gap-6 px-4">
          <button
            onClick={() => {
              setSelectedSkill("READING");
              setSelectedMode("SINGLE_PASSAGE");
              setSelectedPassage(null);
            }}
            className={`flex items-center gap-2 border-b-2 py-3 px-2 text-sm font-bold transition ${
              selectedSkill === "READING" && selectedMode !== "PLACEMENT"
                ? "border-[#0284c7] text-[#0284c7]"
                : "border-transparent text-slate-600 hover:text-[#0284c7]"
            }`}
          >
            <BookOpen className="h-4 w-4 text-[#0284c7]" />
            <span>Reading</span>
          </button>

          <span className="text-slate-200">|</span>

          <button
            onClick={() => {
              setSelectedSkill("LISTENING");
              setSelectedMode("SINGLE_PASSAGE");
              setSelectedPassage(null);
            }}
            className={`flex items-center gap-2 border-b-2 py-3 px-2 text-sm font-bold transition ${
              selectedSkill === "LISTENING" && selectedMode !== "PLACEMENT"
                ? "border-[#0284c7] text-[#0284c7]"
                : "border-transparent text-slate-600 hover:text-[#0284c7]"
            }`}
          >
            <Headphones className="h-4 w-4 text-amber-500" />
            <span>Listening</span>
          </button>

          <span className="text-slate-200">|</span>

          <button
            onClick={() => {
              setSelectedSkill("ALL");
              setSelectedMode("PLACEMENT");
              setSelectedPassage(null);
            }}
            className={`flex items-center gap-2 border-b-2 py-3 px-2 text-sm font-bold transition ${
              selectedMode === "PLACEMENT"
                ? "border-[#1d4ed8] text-[#1d4ed8]"
                : "border-transparent text-slate-600 hover:text-[#1d4ed8]"
            }`}
          >
            <GraduationCap className="h-4 w-4 text-[#1d4ed8]" />
            <span>Thi Xếp Lớp (Placement Test)</span>
          </button>

          <span className="text-slate-200 hidden sm:inline">|</span>

          <button
            onClick={resetAllFilters}
            className={`hidden sm:flex items-center gap-2 border-b-2 py-3 px-2 text-sm font-bold transition ${
              selectedSkill === "ALL" && selectedMode === "ALL"
                ? "border-[#0284c7] text-[#0284c7]"
                : "border-transparent text-slate-600 hover:text-[#0284c7]"
            }`}
          >
            <Sparkles className="h-4 w-4 text-sky-500" />
            <span>Tất cả đề thi ({tests.length})</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (Left Filters Sidebar + Right Practice Grid) */}
      <div className="mx-auto flex max-w-[1360px] flex-col lg:flex-row gap-6 px-4 py-6">
        {/* ================================================================= */}
        {/* LEFT SIDEBAR FILTERS (Replicating Screenshot 1 & 2 in Royal Blue) */}
        {/* ================================================================= */}
        <aside
          className={`shrink-0 transition-all ${
            sidebarCollapsed ? "lg:w-14" : "lg:w-[250px]"
          }`}
        >
          {/* Filter Toggle Row */}
          <div className="mb-3 flex items-center justify-between px-1">
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1.5 text-slate-600 hover:text-[#0284c7] text-xs font-semibold"
              title="Đặt lại bộ lọc"
            >
              <Filter className="h-4 w-4" />
              {!sidebarCollapsed && <span>Bộ lọc ngân hàng đề</span>}
            </button>
            <button
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform ${
                  sidebarCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="space-y-4">
              {/* Highlight Badge Card: BluePass Collect Review đề thi thật */}
              <button
                onClick={() => {
                  setSelectedSkill("ALL");
                  setSelectedMode("ALL");
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-xs hover:border-[#0284c7] transition"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#0284c7]">
                  <MessageSquarePlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-snug">
                    BluePass Collect
                  </p>
                  <p className="text-xs font-bold text-[#0284c7] leading-snug">
                    Review đề thi thật
                  </p>
                </div>
              </button>

              {/* 1. READING FILTER BOX (Royal Blue Active Card matching Screenshot 1) */}
              <div
                className={`overflow-hidden rounded-2xl border transition ${
                  selectedSkill === "READING" && selectedMode !== "PLACEMENT"
                    ? "border-[#0284c7] bg-white shadow-xs"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold ${
                    selectedSkill === "READING" && selectedMode !== "PLACEMENT"
                      ? "bg-[#dbeafe] text-[#1d4ed8]"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <BookOpen className="h-4 w-4 text-[#0284c7]" />
                  <span>Reading</span>
                </div>

                <div className="space-y-2.5 p-3.5 text-xs font-medium text-slate-700">
                  {/* Radio: Bài lẻ */}
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="radio"
                      name="skillMode"
                      checked={
                        selectedSkill === "READING" &&
                        selectedMode === "SINGLE_PASSAGE"
                      }
                      onChange={() => {
                        setSelectedSkill("READING");
                        setSelectedMode("SINGLE_PASSAGE");
                        setSelectedPassage(null);
                      }}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    <span className="font-semibold text-slate-800">Bài lẻ</span>
                  </label>

                  {/* Sub-options: Passage 1, 2, 3 */}
                  <div className="ml-6 space-y-2 border-l border-slate-200 pl-3">
                    {[1, 2, 3].map((pNum) => (
                      <label
                        key={pNum}
                        className="flex cursor-pointer items-center gap-2 text-slate-600 hover:text-[#0284c7]"
                      >
                        <input
                          type="radio"
                          name="readingPassage"
                          checked={
                            selectedSkill === "READING" &&
                            selectedMode === "SINGLE_PASSAGE" &&
                            selectedPassage === pNum
                          }
                          onChange={() => {
                            setSelectedSkill("READING");
                            setSelectedMode("SINGLE_PASSAGE");
                            setSelectedPassage(pNum);
                          }}
                          className="h-3.5 w-3.5 accent-[#0284c7]"
                        />
                        <span>Passage {pNum}</span>
                      </label>
                    ))}
                  </div>

                  {/* Radio: Full đề */}
                  <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                    <input
                      type="radio"
                      name="skillMode"
                      checked={
                        selectedSkill === "READING" &&
                        selectedMode === "FULL_TEST"
                      }
                      onChange={() => {
                        setSelectedSkill("READING");
                        setSelectedMode("FULL_TEST");
                        setSelectedPassage(null);
                      }}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    <span className="font-semibold text-slate-800">Full đề</span>
                  </label>
                </div>
              </div>

              {/* 2. LISTENING FILTER BOX */}
              <div
                className={`overflow-hidden rounded-2xl border transition ${
                  selectedSkill === "LISTENING"
                    ? "border-[#0284c7] bg-white shadow-xs"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold ${
                    selectedSkill === "LISTENING"
                      ? "bg-[#dbeafe] text-[#1d4ed8]"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <Headphones className="h-4 w-4 text-amber-500" />
                  <span>Listening</span>
                </div>

                <div className="space-y-2.5 p-3.5 text-xs font-medium text-slate-700">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="radio"
                      name="skillMode"
                      checked={
                        selectedSkill === "LISTENING" &&
                        selectedMode === "SINGLE_PASSAGE"
                      }
                      onChange={() => {
                        setSelectedSkill("LISTENING");
                        setSelectedMode("SINGLE_PASSAGE");
                        setSelectedPassage(null);
                      }}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    <span>Bài lẻ (Part 1 - 4)</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="radio"
                      name="skillMode"
                      checked={
                        selectedSkill === "LISTENING" &&
                        selectedMode === "FULL_TEST"
                      }
                      onChange={() => {
                        setSelectedSkill("LISTENING");
                        setSelectedMode("FULL_TEST");
                        setSelectedPassage(null);
                      }}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    <span>Full đề</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="radio"
                      name="skillMode"
                      checked={selectedMode === "PLACEMENT"}
                      onChange={() => {
                        setSelectedSkill("ALL");
                        setSelectedMode("PLACEMENT");
                        setSelectedPassage(null);
                      }}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    <span className="font-semibold text-[#1d4ed8]">
                      Thi Xếp Lớp (Placement)
                    </span>
                  </label>
                </div>
              </div>

              {/* 3. NGUỒN TÀI LIỆU (Matches Screenshot 2 Left Sidebar) */}
              <div className="pt-2">
                <button
                  onClick={() => setSourceOpen((o) => !o)}
                  className="flex w-full items-center justify-between py-1.5 text-sm font-bold text-slate-800"
                >
                  <span className="flex items-center gap-1.5">
                    Nguồn tài liệu
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                  {sourceOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </button>
                {sourceOpen && (
                  <div className="mt-2 space-y-2.5 text-xs font-medium text-slate-700">
                    {SOURCE_OPTIONS.map((src) => (
                      <label
                        key={src.value}
                        className="flex cursor-pointer items-center gap-2.5 hover:text-[#0284c7]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(src.value)}
                          onChange={() => toggleSource(src.value)}
                          className="h-4 w-4 rounded border-slate-300 accent-[#0284c7]"
                        />
                        <span>{src.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. LOẠI CÂU HỎI (Matches Screenshot 2 Objective Question Types) */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setQTypeOpen((o) => !o)}
                  className="flex w-full items-center justify-between py-1.5 text-sm font-bold text-slate-800"
                >
                  <span>Loại câu hỏi</span>
                  {qTypeOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </button>
                {qTypeOpen && (
                  <div className="mt-2 space-y-2.5 text-xs font-medium text-slate-700">
                    {QUESTION_TYPE_LABELS.map((qt) => (
                      <label
                        key={qt}
                        className="flex cursor-pointer items-start gap-2.5 hover:text-[#0284c7]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedQuestionTypes.includes(qt)}
                          onChange={() => toggleQuestionType(qt)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#0284c7]"
                        />
                        <span className="leading-snug">{qt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ================================================================= */}
        {/* MAIN CONTENT AREA (Banner + Search + 4-Column Responsive Grid)    */}
        {/* ================================================================= */}
        <div className="flex-1 min-w-0">
          {/* Top CTA Banner (Replicating YouPass Banner in Royal/Ocean Blue Theme) */}
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#0284c7]/30 bg-gradient-to-r from-[#eff6ff] via-white to-[#dbeafe]/60 px-6 py-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#1d4ed8] text-white shadow-md">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
                  <span className="mr-1.5 inline-block rounded-md bg-[#0284c7] px-2 py-0.5 text-xs font-bold text-white">
                    Phá đảo tất cả
                  </span>
                  dạng đề IELTS & Học Thuật cùng BluePass!
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Chốt đầu vào, mục tiêu, thời gian với hệ thống chấm tự động 100% từ máy chủ và nhận lộ trình xếp lớp chuẩn xác!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/exam/test-placement-2026"
                className="rounded-full bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition whitespace-nowrap"
              >
                Thi Xếp Lớp Ngay
              </Link>
            </div>
          </div>

          {/* Filter Bar: Bài chưa làm / Bài đã làm + Search Bar + Xem lịch sử làm bài */}
          <div className="mb-5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50/90 p-2 border border-slate-100">
              {/* Tabs: Bài chưa làm / Bài đã làm */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCompletionTab("UNCOMPLETED")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    completionTab === "UNCOMPLETED"
                      ? "bg-white text-[#0284c7] shadow-xs border border-sky-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Bài chưa làm
                </button>
                <button
                  onClick={() => setCompletionTab("COMPLETED")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    completionTab === "COMPLETED"
                      ? "bg-white text-[#0284c7] shadow-xs border border-sky-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Bài đã làm
                </button>
              </div>

              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAppliedSearch(searchInput);
                }}
                className="flex flex-1 max-w-md items-center rounded-full border border-slate-200 bg-white pl-3.5 pr-1.5 py-1 shadow-2xs"
              >
                <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo tên bài tập (VD: popcorn, short-sightedness...)"
                  className="w-full text-xs text-slate-800 focus:outline-none"
                />
                <button
                  type="submit"
                  className="ml-2 rounded-full bg-[#dbeafe] px-3.5 py-1 text-xs font-bold text-[#1d4ed8] hover:bg-[#0284c7] hover:text-white transition shrink-0"
                >
                  Tìm kiếm
                </button>
              </form>
            </div>

            {/* Link: Xem lịch sử làm bài (Matches Screenshot 1) */}
            <div className="flex items-center justify-between px-1">
              <Link
                href="/portal?tab=history"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284c7] underline-offset-4 hover:underline"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Xem lịch sử làm bài & Kết quả chấm tự động</span>
              </Link>
              <span className="text-[11px] font-medium text-slate-500">
                Hiển thị <strong>{filteredTests.length}</strong> bộ đề chuẩn khảo thí
              </span>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 4-COLUMN RESPONSIVE CARD GRID (Replicating Screenshot 1 & 2)    */}
          {/* =============================================================== */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-sm font-bold text-slate-700">
                Không tìm thấy bài tập phù hợp với bộ lọc hiện tại.
              </p>
              <button
                onClick={resetAllFilters}
                className="mt-3 rounded-xl bg-[#0284c7] px-4 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] transition"
              >
                Xem toàn bộ ngân hàng đề
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTests.map((test) => {
                const badge = getBadgeStyle(test);
                return (
                  <Link
                    key={test.id}
                    href={`/exam/${test.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-[#0284c7] hover:shadow-md transition-all"
                  >
                    {/* Thumbnail Container */}
                    <div className="relative h-36 w-full overflow-hidden bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={test.thumbnailUrl}
                        alt={test.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Top-Left Attempt Count Pill (Exact match to Screenshot: `(A) 7520 lượt làm bài`) */}
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                        <UserCheck className="h-3 w-3 text-sky-300" />
                        <span>
                          {test.attemptCount.toLocaleString("vi-VN")} lượt làm bài
                        </span>
                      </div>

                      {/* Bottom-Left Passage / Part Badge */}
                      <div
                        className={`absolute bottom-2 left-2 rounded-lg px-2.5 py-0.5 text-[11px] font-bold shadow-xs ${badge.className}`}
                      >
                        {badge.label}
                      </div>

                      {/* Hover Start Indicator */}
                      <div className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#0284c7] opacity-0 shadow-sm transition group-hover:opacity-100">
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-1 flex-col justify-between p-3.5">
                      <div>
                        <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-900 group-hover:text-[#0284c7] transition">
                          {test.title}
                        </h3>

                        {/* Bulleted Question Types List */}
                        <ul className="mt-2 space-y-0.5 text-[11px] font-medium text-slate-500">
                          {test.questionTypesSummary.map((qt) => (
                            <li key={qt} className="flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                              <span className="truncate">{qt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Bottom Meta Footer */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <Clock className="h-3 w-3 text-[#0284c7]" />
                          {test.durationMinutes} phút • {test.totalQuestions} câu
                        </span>
                        <span className="font-bold text-[#0284c7] group-hover:translate-x-0.5 transition">
                          Làm bài →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm font-semibold text-slate-500">
          Đang tải ngân hàng đề...
        </div>
      }
    >
      <PracticeBankContent />
    </Suspense>
  );
}
