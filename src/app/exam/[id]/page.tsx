"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Bookmark,
  CheckCircle2,
  Clock,
  EyeOff,
  FileText,
  Flag,
  Headphones,
  Highlighter,
  Loader2,
  Play,
  RotateCcw,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  Volume2,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  GradedQuestionResult,
  QuestionGroupItem,
  QuestionItem,
  TestAttemptItem,
  TestItem,
} from "@/lib/types";

export default function ExamRunnerPage() {
  const params = useParams<{ id: string }>();
  const testId = params?.id || "test-popcorn-cinema";
  const { currentUser } = useApp();

  // Exam State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string>("");
  const [test, setTest] = useState<TestItem | null>(null);
  const [activePartIndex, setActivePartIndex] = useState(0);

  // Answers & Review Bookmarks
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);

  // Server-Authoritative Timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1200);
  const expiresAtMsRef = useRef<number>(0);
  const serverOffsetMsRef = useRef<number>(0);

  // Anti-Cheat Tab Switch Tracker
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [tabWarningBanner, setTabWarningBanner] = useState<string | null>(null);

  // Auto-save & Submission State
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);

  // Post-Submission Result State
  const [submittedAttempt, setSubmittedAttempt] =
    useState<TestAttemptItem | null>(null);
  const [unlockedTranscripts, setUnlockedTranscripts] = useState<
    { partNumber: number; title: string; audioTranscript: string | null }[]
  >([]);

  // Reading Passage UX Tools (Font size, Highlighter, Notes)
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [highlightColor, setHighlightColor] = useState<
    "yellow" | "blue" | "green"
  >("yellow");
  const [passageNotes, setPassageNotes] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const passageContainerRef = useRef<HTMLDivElement>(null);

  // Listening Audio Controls
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const localStorageKey = `bluepass_exam_draft_${currentUser.id}_${testId}`;

  // =========================================================================
  // 1. INITIALIZE EXAM & SYNC SERVER-AUTHORITATIVE TIMER
  // =========================================================================
  const startOrResumeExam = useCallback(
    async (forceNew = false) => {
      setLoading(true);
      setError(null);
      setSubmittedAttempt(null);

      try {
        const res = await fetch(
          `/api/tests/${testId}/start?userId=${currentUser.id}${
            forceNew ? "&forceNew=true" : ""
          }`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Không thể khởi tạo bài thi.");
          return;
        }

        setAttemptId(data.attemptId);
        setTest(data.test);

        // Calculate offset between server clock and client clock
        const serverNowMs = new Date(data.serverTime).getTime();
        const clientNowMs = Date.now();
        serverOffsetMsRef.current = serverNowMs - clientNowMs;

        const expMs = new Date(data.expiresAt).getTime();
        expiresAtMsRef.current = expMs;

        const initialRemaining = Math.max(
          0,
          Math.floor((expMs - serverNowMs) / 1000)
        );
        setRemainingSeconds(initialRemaining);

        // Recover draft from both Server and localStorage (Crash / F5 Recovery)
        let mergedAnswers: Record<string, string | string[]> = {
          ...(data.draftAnswers || {}),
        };
        let mergedFlags: number[] = Array.isArray(data.flaggedQuestions)
          ? data.flaggedQuestions
          : [];
        let mergedTabSwitches: number = data.tabSwitchCount || 0;

        if (!forceNew) {
          try {
            const localRaw = localStorage.getItem(localStorageKey);
            if (localRaw) {
              const parsed = JSON.parse(localRaw);
              if (parsed.attemptId === data.attemptId) {
                mergedAnswers = { ...mergedAnswers, ...(parsed.answers || {}) };
                if (Array.isArray(parsed.flaggedQuestions)) {
                  mergedFlags = parsed.flaggedQuestions;
                }
                if (
                  typeof parsed.tabSwitchCount === "number" &&
                  parsed.tabSwitchCount > mergedTabSwitches
                ) {
                  mergedTabSwitches = parsed.tabSwitchCount;
                }
              }
            }
          } catch {
            // Ignore localStorage parse errors
          }
        } else {
          try {
            localStorage.removeItem(localStorageKey);
          } catch {
            // Ignore
          }
        }

        setAnswers(mergedAnswers);
        setFlaggedQuestions(mergedFlags);
        setTabSwitchCount(mergedTabSwitches);
      } catch {
        setError("Lỗi kết nối đến máy chủ khảo thí.");
      } finally {
        setLoading(false);
      }
    },
    [testId, currentUser.id, localStorageKey]
  );

  useEffect(() => {
    startOrResumeExam(false);
  }, [startOrResumeExam]);

  // =========================================================================
  // 2. IMMEDIATE LOCALSTORAGE PERSISTENCE (Crash Recovery on F5)
  // =========================================================================
  useEffect(() => {
    if (!attemptId || submittedAttempt) return;
    try {
      localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          attemptId,
          answers,
          flaggedQuestions,
          tabSwitchCount,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [attemptId, answers, flaggedQuestions, tabSwitchCount, localStorageKey, submittedAttempt]);

  // =========================================================================
  // 3. DEBOUNCED 10-SECOND AUTO-SAVE TO BACKEND (`POST /api/tests/[id]/save-draft`)
  // =========================================================================
  const syncDraftToServer = useCallback(async () => {
    if (!attemptId || submittedAttempt || isSubmitting) return;
    setIsSavingDraft(true);
    try {
      const res = await fetch(`/api/tests/${testId}/save-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          draftAnswers: answers,
          flaggedQuestions,
          tabSwitchCount,
        }),
      });
      if (res.ok) {
        setLastSavedAt(
          new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      }
    } catch {
      // Silent retry on next 10s interval
    } finally {
      setIsSavingDraft(false);
    }
  }, [attemptId, submittedAttempt, isSubmitting, testId, answers, flaggedQuestions, tabSwitchCount]);

  useEffect(() => {
    if (!attemptId || submittedAttempt) return;
    const interval = setInterval(() => {
      syncDraftToServer();
    }, 10_000);
    return () => clearInterval(interval);
  }, [attemptId, submittedAttempt, syncDraftToServer]);

  // =========================================================================
  // 4. ANTI-CHEAT TAB-SWITCH TRACKER (`visibilitychange` & window blur)
  // =========================================================================
  useEffect(() => {
    if (!attemptId || submittedAttempt) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          setTabWarningBanner(
            `⚠️ Cảnh báo Giám sát Chống gian lận: Hệ thống vừa ghi nhận bạn rời khỏi màn hình làm bài (Lần thứ ${next}). Dữ liệu này được gửi trực tiếp lên Bảng Xếp Hạng Admin!`
          );
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [attemptId, submittedAttempt]);

  // =========================================================================
  // 5. SERVER-AUTHORITATIVE COUNTDOWN & AUTO-SUBMIT ON EXPIRATION
  // =========================================================================
  const handleSubmitExam = useCallback(async () => {
    if (!attemptId || isSubmitting || submittedAttempt) return;
    setIsSubmitting(true);
    setShowConfirmSubmitModal(false);

    try {
      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers,
          flaggedQuestions,
          tabSwitchCount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.attempt) {
        setSubmittedAttempt(data.attempt);
        setUnlockedTranscripts(data.audioTranscripts || []);
        try {
          localStorage.removeItem(localStorageKey);
        } catch {
          // Ignore
        }
      } else {
        setError(data.error || "Không thể nộp bài thi.");
      }
    } catch {
      setError("Lỗi kết nối khi nộp bài thi.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    attemptId,
    isSubmitting,
    submittedAttempt,
    testId,
    answers,
    flaggedQuestions,
    tabSwitchCount,
    localStorageKey,
  ]);

  useEffect(() => {
    if (!attemptId || submittedAttempt) return;

    const timer = setInterval(() => {
      const authoritativeNow = Date.now() + serverOffsetMsRef.current;
      const diffSec = Math.max(
        0,
        Math.floor((expiresAtMsRef.current - authoritativeNow) / 1000)
      );
      setRemainingSeconds(diffSec);

      if (diffSec <= 0) {
        clearInterval(timer);
        handleSubmitExam();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptId, submittedAttempt, handleSubmitExam]);

  // =========================================================================
  // 6. HELPERS FOR QUESTION ANSWERS, FLAGS & TEXT HIGHLIGHTING
  // =========================================================================
  const allQuestionsFlat = useMemo(() => {
    if (!test) return [];
    const list: { question: QuestionItem; group: QuestionGroupItem }[] = [];
    for (const part of test.parts) {
      for (const group of part.questionGroups) {
        for (const q of group.questions) {
          list.push({ question: q, group });
        }
      }
    }
    return list;
  }, [test]);

  const isQuestionAttempted = (qId: string): boolean => {
    const val = answers[qId];
    if (Array.isArray(val)) return val.length > 0;
    return typeof val === "string" && val.trim().length > 0;
  };

  const handleSingleAnswerChange = (qId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: value,
    }));
  };

  const handleMultiChoiceToggle = (qId: string, optionVal: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[qId]) ? (prev[qId] as string[]) : [];
      const exists = current.includes(optionVal);
      const next = exists
        ? current.filter((v) => v !== optionVal)
        : [...current, optionVal];
      return {
        ...prev,
        [qId]: next,
      };
    });
  };

  const toggleFlagQuestion = (qNum: number) => {
    setFlaggedQuestions((prev) =>
      prev.includes(qNum) ? prev.filter((n) => n !== qNum) : [...prev, qNum]
    );
  };

  const scrollToQuestion = (qNum: number) => {
    const el = document.getElementById(`exam-question-${qNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Interactive Text Highlighter for Reading Passage
  const handleHighlightSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (
      passageContainerRef.current &&
      passageContainerRef.current.contains(range.commonAncestorContainer)
    ) {
      try {
        const mark = document.createElement("mark");
        const colorMap = {
          yellow: "bg-amber-200/90 text-slate-900 px-0.5 rounded",
          blue: "bg-sky-200/90 text-slate-900 px-0.5 rounded",
          green: "bg-emerald-200/90 text-slate-900 px-0.5 rounded",
        };
        mark.className = colorMap[highlightColor];
        range.surroundContents(mark);
        selection.removeAllRanges();
      } catch {
        // Ignore cross-node selection wrap restrictions
      }
    }
  };

  // Spoken Dialogue Voice Narrator for Listening Tests (Web Speech API)
  const playSpokenListeningDialogue = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      return;
    }

    const spokenScript =
      "Good morning, Northside Community Sports Centre. How can I help you? " +
      "Hi! I would like to inquire about joining the centre and booking a few classes. " +
      "Certainly. If you opt for our Gold Annual Membership, the monthly fee is 45 pounds, and that includes free access to the heated swimming pool and sauna. " +
      "Great. Are there any beginner badminton sessions this week? " +
      "Yes, coach David runs the beginner badminton clinic every Thursday evening at 7 PM. Players just need to bring indoor court shoes with non-marking soles; we provide all rackets and shuttlecocks. " +
      "When you enter through the Main Gate on Oak Road, turn left immediately after the gate. Zone A next to the rose garden is our dedicated Member Car Park. " +
      "If you walk past the Reception Building towards the back of the complex, the Olympic Swimming Pool is located in Zone C, right opposite the Squash Courts.";

    const utterance = new SpeechSynthesisUtterance(spokenScript);
    utterance.lang = "en-GB";
    utterance.rate = playbackRate;
    utterance.onend = () => setIsTtsPlaying(false);
    utterance.onerror = () => setIsTtsPlaying(false);
    setIsTtsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#eff6ff] p-6">
        <Loader2 className="h-10 w-10 animate-spin text-[#0284c7]" />
        <p className="mt-3 text-sm font-bold text-[#1d4ed8]">
          Đang khởi tạo phòng thi bảo mật & đồng bộ đồng hồ máy chủ...
        </p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="mt-3 text-lg font-bold text-slate-800">
          {error || "Không tìm thấy đề thi."}
        </h2>
        <Link
          href="/"
          className="mt-4 rounded-xl bg-[#0284c7] px-5 py-2.5 text-xs font-bold text-white"
        >
          Quay về Ngân hàng đề
        </Link>
      </div>
    );
  }

  const currentPart = test.parts[activePartIndex] || test.parts[0];
  const attemptedCount = allQuestionsFlat.filter(({ question }) =>
    isQuestionAttempted(question.id)
  ).length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      {/* =================================================================== */}
      {/* TOP EXAM BAR (Royal Blue Header + Server Timer + Anti-Cheat Status) */}
      {/* =================================================================== */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#1d4ed8] px-4 py-2.5 text-white shadow-md">
        {/* Left: Back Button & Test Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-bold hover:bg-white/25 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Thoát</span>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-extrabold">{test.title}</h1>
              {test.isPlacement && (
                <span className="shrink-0 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-900">
                  THI XẾP LỚP (PROCTORED)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-sky-100">
              <span>
                Học viên: <strong>{currentUser.fullName}</strong> (
                {currentUser.studentCode})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Save className="h-3 w-3 text-emerald-300" />
                {isSavingDraft
                  ? "Đang lưu nháp..."
                  : lastSavedAt
                  ? `Đã lưu tự động lúc ${lastSavedAt}`
                  : "Tự động lưu mỗi 10 giây (Crash Recovery)"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Server-Authoritative Timer + Tab-Switch Counter */}
        <div className="flex items-center gap-3">
          {!submittedAttempt ? (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-1.5 font-mono text-base font-black shadow-inner ${
                remainingSeconds < 180
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-slate-900/40 text-white border border-white/20"
              }`}
              title="Thời gian được đồng bộ và kiểm tra trực tiếp trên máy chủ PostgreSQL"
            >
              <Clock className="h-4 w-4 text-amber-300" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-extrabold text-white shadow-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>ĐÃ NỘP BÀI & CHẤM TỰ ĐỘNG 100%</span>
            </div>
          )}

          {/* Anti-Cheat Tab Switch Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
              tabSwitchCount === 0
                ? "bg-white/15 text-sky-100"
                : tabSwitchCount < 3
                ? "bg-amber-400 text-slate-900"
                : "bg-red-500 text-white"
            }`}
            title="Số lần chuyển tab hoặc rời màn hình được ghi nhận chống gian lận"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Chuyển tab: {tabSwitchCount} lần</span>
          </div>
        </div>

        {/* Right: Save Draft & Submit Button */}
        <div className="flex items-center gap-2">
          {!submittedAttempt ? (
            <>
              <button
                type="button"
                onClick={syncDraftToServer}
                disabled={isSavingDraft}
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25 transition"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Lưu nháp</span>
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmSubmitModal(true)}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-900 shadow-md hover:bg-amber-300 transition"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  Nộp bài ({attemptedCount}/{allQuestionsFlat.length})
                </span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => startOrResumeExam(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-[#1d4ed8] shadow-sm hover:bg-sky-50 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Làm lại đề này</span>
            </button>
          )}
        </div>
      </header>

      {/* Anti-Cheat Warning Banner when Student Switches Tab */}
      {tabWarningBanner && !submittedAttempt && (
        <div className="flex items-center justify-between bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{tabWarningBanner}</span>
          </div>
          <button
            onClick={() => setTabWarningBanner(null)}
            className="rounded bg-slate-900/15 px-2 py-0.5 text-[11px] hover:bg-slate-900/25"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* POST-SUBMISSION SCORE SUMMARY BANNER (If Submitted)                 */}
      {/* =================================================================== */}
      {submittedAttempt && (
        <div className="shrink-0 border-b border-sky-200 bg-gradient-to-r from-[#eff6ff] via-white to-[#dbeafe] px-6 py-3.5">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0284c7] text-white shadow-md">
                <Award className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Kết Quả Chấm Tự Động Từ Máy Chủ:{" "}
                  <span className="text-[#0284c7]">
                    {submittedAttempt.rawScore} / {submittedAttempt.totalQuestions} điểm
                  </span>{" "}
                  ({submittedAttempt.percentageScore}%)
                </h2>
                <p className="text-xs text-slate-600">
                  Band quy đổi:{" "}
                  <strong className="text-[#1d4ed8]">
                    IELTS {submittedAttempt.bandScore.toFixed(1)}
                  </strong>{" "}
                  • Thời gian hoàn thành:{" "}
                  <strong>{submittedAttempt.timeSpentSeconds} giây</strong> • Số lần
                  chuyển tab:{" "}
                  <strong>{submittedAttempt.tabSwitchCount} lần</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/portal"
                className="rounded-xl border border-[#0284c7] bg-white px-3.5 py-2 text-xs font-bold text-[#0284c7] hover:bg-[#eff6ff] transition"
              >
                Xem Cổng Thông Báo Xếp Lớp
              </Link>
              <Link
                href="/admin"
                className="rounded-xl bg-[#1d4ed8] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0284c7] transition"
              >
                Xem Bảng Xếp Hạng Admin
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SPLIT-SCREEN EXAM WORKSPACE (Left: Passage/Audio | Right: Questions) */}
      {/* =================================================================== */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE: READING PASSAGE OR LISTENING AUDIO PLAYER */}
        <div className="flex w-full lg:w-1/2 flex-col border-b lg:border-b-0 lg:border-r border-slate-300 bg-white overflow-hidden">
          {/* Left Pane Toolbar (Part Switcher + Highlighter + Font Size) */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-[#eff6ff]/70 px-4 py-2">
            <div className="flex items-center gap-1.5">
              {test.parts.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActivePartIndex(idx)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    activePartIndex === idx
                      ? "bg-[#0284c7] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:text-[#0284c7]"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>

            {test.skill === "READING" && (
              <div className="flex items-center gap-2">
                {/* Highlighter Tool */}
                <div className="flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-2 py-1">
                  <Highlighter className="h-3.5 w-3.5 text-[#0284c7]" />
                  {(["yellow", "blue", "green"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setHighlightColor(c)}
                      className={`h-4 w-4 rounded-full border ${
                        c === "yellow"
                          ? "bg-amber-300"
                          : c === "blue"
                          ? "bg-sky-300"
                          : "bg-emerald-300"
                      } ${
                        highlightColor === c
                          ? "ring-2 ring-[#1d4ed8] ring-offset-1"
                          : "opacity-70"
                      }`}
                      title={`Bôi đậm màu ${c}`}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={handleHighlightSelection}
                    className="ml-1 text-[11px] font-bold text-[#0284c7] hover:underline"
                  >
                    Highlight vùng chọn
                  </button>
                </div>

                {/* Font Size Switcher */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-bold">
                  {(
                    [
                      { k: "sm", label: "A-" },
                      { k: "base", label: "A" },
                      { k: "lg", label: "A+" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.k}
                      onClick={() => setFontSize(item.k)}
                      className={`rounded px-2 py-0.5 ${
                        fontSize === item.k
                          ? "bg-[#0284c7] text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Left Pane Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentPart.subtitle && (
              <div className="mb-4 rounded-xl border border-sky-100 bg-[#eff6ff] px-4 py-2.5 text-xs font-medium text-[#1d4ed8]">
                {currentPart.subtitle}
              </div>
            )}

            {/* If Listening Test: Render HTTP Range Streaming Audio Player + Spoken Dialogue Narrator */}
            {test.skill === "LISTENING" && (
              <div className="mb-6 rounded-2xl border border-sky-200 bg-gradient-to-br from-[#eff6ff] to-white p-5 shadow-xs">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0284c7] text-white">
                      <Headphones className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Trình Phát Audio Chuẩn Phòng Thi (HTTP Range Streaming)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Hỗ trợ tua nhanh (Byte-Range 206), tải trước (Preload) và giọng đọc hội thoại trực tiếp
                      </p>
                    </div>
                  </div>

                  {/* Playback Speed Selector */}
                  <div className="flex items-center gap-1 rounded-xl border border-sky-200 bg-white p-1 text-xs font-bold">
                    {[0.75, 1.0, 1.25].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => {
                          setPlaybackRate(rate);
                          if (audioRef.current) {
                            audioRef.current.playbackRate = rate;
                          }
                        }}
                        className={`rounded-lg px-2 py-1 transition ${
                          playbackRate === rate
                            ? "bg-[#0284c7] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Native HTML5 Audio with HTTP Range Streaming */}
                <audio
                  ref={audioRef}
                  controls
                  preload="auto"
                  src={currentPart.audioUrl || "/api/audio/northside-sports-centre"}
                  className="w-full rounded-xl"
                />

                {/* Interactive English Voice Dialogue Narrator Button */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-sky-100">
                  <span className="text-xs font-medium text-slate-600">
                    Muốn nghe lời thoại tiếng Anh đọc trực tiếp từng câu?
                  </span>
                  <button
                    type="button"
                    onClick={playSpokenListeningDialogue}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                      isTtsPlaying
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] hover:opacity-95"
                    }`}
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>
                      {isTtsPlaying
                        ? "Dừng đọc hội thoại (Stop)"
                        : "Phát Giọng Đọc Hội Thoại Tiếng Anh (British Voice)"}
                    </span>
                  </button>
                </div>

                {/* Northside Sports Complex Visual Map Reference for Map Labelling Questions */}
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1d4ed8] mb-3">
                    Sơ Đồ Khu Liên Hợp Thể Thao Northside (Dùng cho Câu 4 – 5)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border-2 border-dashed border-sky-300 bg-[#eff6ff] p-3">
                      <span className="inline-block rounded bg-[#0284c7] px-2 py-0.5 text-[11px] font-bold text-white">
                        ZONE A
                      </span>
                      <p className="mt-1 font-semibold text-slate-800">
                        Ngay bên trái Cổng Chính (Main Gate), cạnh Vườn Hoa Hồng (Rose Garden)
                      </p>
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3">
                      <span className="inline-block rounded bg-slate-700 px-2 py-0.5 text-[11px] font-bold text-white">
                        ZONE B
                      </span>
                      <p className="mt-1 font-semibold text-slate-800">
                        Khu Cánh Đông (East Wing Café & Khu nghỉ chân)
                      </p>
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-sky-300 bg-[#eff6ff] p-3">
                      <span className="inline-block rounded bg-[#1d4ed8] px-2 py-0.5 text-[11px] font-bold text-white">
                        ZONE C
                      </span>
                      <p className="mt-1 font-semibold text-slate-800">
                        Phía sau Tòa Lễ Tân, đối diện Sân Bóng Quần (Squash Courts)
                      </p>
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3">
                      <span className="inline-block rounded bg-slate-700 px-2 py-0.5 text-[11px] font-bold text-white">
                        ZONE D
                      </span>
                      <p className="mt-1 font-semibold text-slate-800">
                        Cụm Sân Quần Vợt Ngoài Trời (Outdoor Tennis Pavilion)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unlocked Audio Transcript (ONLY shown AFTER server submission!) */}
                {submittedAttempt && unlockedTranscripts.length > 0 && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 mb-2">
                      <FileText className="h-4 w-4" />
                      Transcript Lời Thoại Chính Thức (Đã mở khóa sau khi nộp bài)
                    </h4>
                    <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700">
                      {unlockedTranscripts[0]?.audioTranscript}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reading Passage HTML with Highlight Support */}
            {currentPart.passageHtml && (
              <div
                ref={passageContainerRef}
                onMouseUp={handleHighlightSelection}
                className={`prose max-w-none select-text ${
                  fontSize === "sm"
                    ? "text-xs leading-relaxed"
                    : fontSize === "lg"
                    ? "text-base leading-loose"
                    : "text-sm leading-relaxed"
                }`}
                dangerouslySetInnerHTML={{ __html: currentPart.passageHtml }}
              />
            )}

            {/* Student Inline Study Notes Box */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                📝 Ghi chú nháp trong lúc đọc / nghe (Lưu cục bộ)
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Ghi chú từ khóa hoặc đoạn văn..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#0284c7] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (noteInput.trim()) {
                      setPassageNotes((prev) => [...prev, noteInput.trim()]);
                      setNoteInput("");
                    }
                  }}
                  className="rounded-xl bg-[#0284c7] px-3 py-1.5 text-xs font-bold text-white"
                >
                  Thêm ghi chú
                </button>
              </div>
              {passageNotes.length > 0 && (
                <ul className="mt-2.5 space-y-1 text-xs text-slate-600 list-disc pl-5">
                  {passageNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANE: OBJECTIVE QUESTIONS LIST + BOTTOM NAVIGATOR PALETTE   */}
        {/* ================================================================= */}
        <div className="flex w-full lg:w-1/2 flex-col bg-slate-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {currentPart.questionGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
              >
                {/* Group Header & Instructions */}
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[#1d4ed8]">
                      {group.title}
                    </h3>
                    {group.wordLimitNote && (
                      <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 border border-amber-200">
                        Giới hạn từ: {group.wordLimitNote}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {group.instructions}
                  </p>
                </div>

                {/* Shared Options Box (for Matching Headings / Matching Features / Matching Info / Map) */}
                {group.sharedOptions && group.sharedOptions.items && (
                  <div className="mb-4 rounded-xl border border-sky-200 bg-[#eff6ff] p-3.5">
                    <h4 className="text-xs font-extrabold text-[#1d4ed8] mb-2">
                      {group.sharedOptions.title || "Danh sách Lựa chọn"}
                    </h4>
                    <div className="space-y-1 text-xs text-slate-700">
                      {group.sharedOptions.items.map((opt) => (
                        <div key={opt.key} className="flex items-start gap-2">
                          <span className="inline-block min-w-[24px] rounded bg-[#0284c7] px-1.5 py-0.2 text-center text-[11px] font-bold text-white">
                            {opt.key}
                          </span>
                          <span className="font-medium">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Objective Questions */}
                <div className="space-y-4">
                  {group.questions.map((q) => {
                    const isFlagged = flaggedQuestions.includes(
                      q.questionNumber
                    );
                    const attempted = isQuestionAttempted(q.id);
                    const graded: GradedQuestionResult | undefined =
                      submittedAttempt?.gradedDetails?.[q.id];

                    return (
                      <div
                        key={q.id}
                        id={`exam-question-${q.questionNumber}`}
                        className={`rounded-xl border p-4 transition ${
                          graded
                            ? graded.isCorrect
                              ? "border-emerald-300 bg-emerald-50/40"
                              : "border-red-300 bg-red-50/40"
                            : isFlagged
                            ? "border-amber-400 bg-amber-50/30"
                            : attempted
                            ? "border-sky-200 bg-[#eff6ff]/30"
                            : "border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        {/* Question Number + Prompt + Flag Review Button */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-lg px-1.5 text-xs font-extrabold ${
                                isFlagged
                                  ? "bg-amber-500 text-white"
                                  : attempted
                                  ? "bg-[#0284c7] text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {q.questionNumber}
                            </span>
                            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                              {q.prompt}
                            </p>
                          </div>

                          {!submittedAttempt && (
                            <button
                              type="button"
                              onClick={() => toggleFlagQuestion(q.questionNumber)}
                              className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                                isFlagged
                                  ? "bg-amber-500 text-white shadow-2xs"
                                  : "bg-white text-slate-500 border border-slate-200 hover:border-amber-400 hover:text-amber-600"
                              }`}
                              title="Đánh dấu câu hỏi màu Vàng (Amber) để xem lại trước khi nộp"
                            >
                              <Flag className="h-3 w-3 fill-current" />
                              <span className="hidden sm:inline">
                                {isFlagged ? "Đã đánh dấu" : "Xem lại"}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* ================================================= */}
                        {/* INPUT CONTROLS BY OBJECTIVE QUESTION TYPE         */}
                        {/* ================================================= */}
                        <div className="mt-3 pl-8">
                          {/* 1. GAP FILLING (Short-Answer Text Input) */}
                          {group.questionType === "GAP_FILL" && (
                            <div className="max-w-sm">
                              <input
                                type="text"
                                disabled={Boolean(submittedAttempt)}
                                value={String(answers[q.id] ?? "")}
                                onChange={(e) =>
                                  handleSingleAnswerChange(q.id, e.target.value)
                                }
                                placeholder="Nhập câu trả lời tiếng Anh..."
                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1d4ed8] focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20 focus:outline-none disabled:bg-slate-100"
                              />
                            </div>
                          )}

                          {/* 2. TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN or SINGLE_CHOICE */}
                          {(group.questionType === "TFNG" ||
                            group.questionType === "YNNG" ||
                            group.questionType === "SINGLE_CHOICE") &&
                            q.options && (
                              <div className="space-y-2">
                                {q.options.map((opt) => {
                                  const selected = answers[q.id] === opt.value;
                                  return (
                                    <label
                                      key={opt.value}
                                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                                        selected
                                          ? "border-[#0284c7] bg-[#eff6ff] text-[#1d4ed8]"
                                          : "border-slate-200 bg-white text-slate-700 hover:border-sky-200"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`q-${q.id}`}
                                        disabled={Boolean(submittedAttempt)}
                                        checked={selected}
                                        onChange={() =>
                                          handleSingleAnswerChange(
                                            q.id,
                                            opt.value
                                          )
                                        }
                                        className="h-4 w-4 accent-[#0284c7]"
                                      />
                                      <span>
                                        {opt.label !== opt.text
                                          ? `${opt.label}. ${opt.text}`
                                          : opt.text}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                          {/* 3. MULTIPLE CHOICE (MANY ANSWERS) */}
                          {group.questionType === "MULTI_CHOICE" && q.options && (
                            <div className="space-y-2">
                              {q.options.map((opt) => {
                                const currentArr = Array.isArray(answers[q.id])
                                  ? (answers[q.id] as string[])
                                  : [];
                                const checked = currentArr.includes(opt.value);
                                return (
                                  <label
                                    key={opt.value}
                                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                                      checked
                                        ? "border-[#0284c7] bg-[#eff6ff] text-[#1d4ed8]"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-200"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={Boolean(submittedAttempt)}
                                      checked={checked}
                                      onChange={() =>
                                        handleMultiChoiceToggle(q.id, opt.value)
                                      }
                                      className="h-4 w-4 rounded accent-[#0284c7]"
                                    />
                                    <span>
                                      <strong>{opt.label}.</strong> {opt.text}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* 4. MATCHING HEADINGS / INFO / FEATURES / MAP LABELLING (Dropdown Selectors) */}
                          {(group.questionType === "MATCHING_HEADINGS" ||
                            group.questionType === "MATCHING_INFO" ||
                            group.questionType === "MATCHING_FEATURES" ||
                            group.questionType === "MAP_DIAGRAM_LABEL") && (
                            <div className="max-w-md">
                              <select
                                disabled={Boolean(submittedAttempt)}
                                value={String(answers[q.id] ?? "")}
                                onChange={(e) =>
                                  handleSingleAnswerChange(q.id, e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1d4ed8] focus:border-[#0284c7] focus:outline-none disabled:bg-slate-100"
                              >
                                <option value="">
                                  -- Chọn đáp án phù hợp --
                                </option>
                                {group.sharedOptions?.items?.map((item) => (
                                  <option key={item.key} value={item.key}>
                                    {item.key} — {item.text}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* =============================================== */}
                          {/* SERVER-GRADED FEEDBACK & EXPLANATION (Post-Exam)*/}
                          {/* =============================================== */}
                          {graded && (
                            <div
                              className={`mt-3 rounded-xl border p-3 text-xs ${
                                graded.isCorrect
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                  : "border-red-200 bg-red-50 text-red-900"
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-2 font-bold">
                                {graded.isCorrect ? (
                                  <span className="flex items-center gap-1 text-emerald-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Chính xác (+{graded.pointsEarned} điểm)
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-700">
                                    <XCircle className="h-4 w-4" />
                                    Chưa chính xác (0 điểm)
                                  </span>
                                )}
                                <span>•</span>
                                <span>
                                  Đáp án chuẩn:{" "}
                                  <code className="rounded bg-white px-1.5 py-0.5 font-mono font-extrabold text-[#1d4ed8]">
                                    {graded.acceptedVariants.join(" / ")}
                                  </code>
                                </span>
                              </div>
                              <p className="mt-1.5 text-slate-700 leading-relaxed">
                                💡 <strong>Giải thích:</strong>{" "}
                                {graded.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* =============================================================== */}
          {/* BOTTOM QUESTION NAVIGATOR PALETTE (Blue / Gray / Amber)         */}
          {/* =============================================================== */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Palette Number Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-extrabold text-slate-700">
                  Bảng câu hỏi:
                </span>
                {allQuestionsFlat.map(({ question }) => {
                  const qNum = question.questionNumber;
                  const isFlagged = flaggedQuestions.includes(qNum);
                  const attempted = isQuestionAttempted(question.id);
                  const graded = submittedAttempt?.gradedDetails?.[question.id];

                  let btnClass =
                    "bg-slate-200 text-slate-700 hover:bg-slate-300"; // Unattempted in Gray
                  if (graded) {
                    btnClass = graded.isCorrect
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 text-white";
                  } else if (isFlagged) {
                    btnClass =
                      "bg-amber-500 text-white ring-2 ring-amber-300"; // Flagged in Amber
                  } else if (attempted) {
                    btnClass = "bg-[#0284c7] text-white"; // Attempted in Blue
                  }

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => scrollToQuestion(qNum)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold transition ${btnClass}`}
                    >
                      {qNum}
                    </button>
                  );
                })}
              </div>

              {/* Legend: Attempted (Blue), Unattempted (Gray), Flagged (Amber) */}
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-[#0284c7]" />
                  Đã làm ({attemptedCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-slate-200" />
                  Chưa làm ({allQuestionsFlat.length - attemptedCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-amber-500" />
                  Xem lại ({flaggedQuestions.length})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* CONFIRM SUBMISSION MODAL                                            */}
      {/* =================================================================== */}
      {showConfirmSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-sky-100">
            <h3 className="text-lg font-extrabold text-slate-900">
              Xác nhận nộp bài & chấm điểm tự động?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Bạn đã hoàn thành{" "}
              <strong className="text-[#0284c7]">
                {attemptedCount} / {allQuestionsFlat.length} câu hỏi
              </strong>
              {flaggedQuestions.length > 0 && (
                <span>
                  {" "}
                  (còn{" "}
                  <strong className="text-amber-600">
                    {flaggedQuestions.length} câu đang đánh dấu màu vàng
                  </strong>{" "}
                  cần xem lại)
                </span>
              )}
              . Sau khi nộp, máy chủ sẽ khóa phiên làm bài (Idempotent Lock) và
              trả kết quả chấm điểm ngay lập tức.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmSubmitModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Kiểm tra lại bài
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-5 py-2 text-xs font-extrabold text-white shadow-md hover:opacity-95"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Đang chấm điểm..." : "Nộp bài chính thức"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
