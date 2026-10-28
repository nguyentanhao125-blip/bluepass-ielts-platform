"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookMarked,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Keyboard,
  Layers,
  List,
  RotateCcw,
  Sparkles,
  Volume2,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { VocabDeckItem, VocabWordItem } from "@/lib/types";

type PracticeMode = "LIST" | "FLASHCARD" | "QUIZ" | "DICTATION";

export default function VocabularyHubPage() {
  const { currentUser } = useApp();
  const [decks, setDecks] = useState<VocabDeckItem[]>([]);
  const [progress, setProgress] = useState<
    Record<string, "NEW" | "LEARNING" | "MASTERED">
  >({});
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [mode, setMode] = useState<PracticeMode>("LIST");

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // 4-Option Multiple Choice Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(
    null
  );
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Listening / Typing Dictation state
  const [dictationIndex, setDictationIndex] = useState(0);
  const [dictationInput, setDictationInput] = useState("");
  const [dictationFeedback, setDictationFeedback] = useState<
    "CORRECT" | "WRONG" | null
  >(null);

  useEffect(() => {
    async function loadVocab() {
      const res = await fetch(`/api/vocab?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        const loadedDecks: VocabDeckItem[] = data.decks || [];
        setDecks(loadedDecks);
        setProgress(data.progress || {});
        if (loadedDecks.length > 0) {
          setSelectedDeckId(loadedDecks[0].id);
        }
      }
    }
    loadVocab();
  }, [currentUser.id]);

  const currentDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) || decks[0],
    [decks, selectedDeckId]
  );

  const words: VocabWordItem[] = useMemo(
    () => currentDeck?.words || [],
    [currentDeck]
  );

  const speakWord = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 0.92;
      window.speechSynthesis.speak(utter);
    }
  };

  const updateWordStatus = async (
    wordId: string,
    status: "NEW" | "LEARNING" | "MASTERED"
  ) => {
    setProgress((prev) => ({ ...prev, [wordId]: status }));
    await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.id,
        wordId,
        status,
      }),
    });
  };

  // Generate 4 deterministic options for the current quiz question
  const currentQuizWord = words[quizIndex];
  const quizOptions = useMemo(() => {
    if (!currentQuizWord || words.length === 0) return [];
    const others = words
      .filter((w) => w.id !== currentQuizWord.id)
      .map((w) => w.meaningVi);
    const distractors = others.slice(0, 3);
    while (distractors.length < 3) {
      distractors.push("Sự thay đổi cấu trúc tự nhiên trong môi trường");
    }
    const combined = [currentQuizWord.meaningVi, ...distractors];
    // Deterministic shuffle based on word id length + quizIndex
    return combined.sort((a, b) => a.localeCompare(b));
  }, [currentQuizWord, words]);

  const handleSelectQuizOption = (optionMeaning: string) => {
    if (selectedQuizOption) return;
    setSelectedQuizOption(optionMeaning);
    if (optionMeaning === currentQuizWord.meaningVi) {
      setQuizScore((s) => s + 1);
      updateWordStatus(currentQuizWord.id, "MASTERED");
    }
  };

  const handleNextQuiz = () => {
    if (quizIndex + 1 >= words.length) {
      setQuizFinished(true);
    } else {
      setQuizIndex((i) => i + 1);
      setSelectedQuizOption(null);
    }
  };

  const currentDictationWord = words[dictationIndex];
  const handleCheckDictation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDictationWord) return;
    const normalizedInput = dictationInput.trim().toLowerCase();
    const expected = currentDictationWord.word.trim().toLowerCase();
    if (normalizedInput === expected) {
      setDictationFeedback("CORRECT");
      updateWordStatus(currentDictationWord.id, "MASTERED");
    } else {
      setDictationFeedback("WRONG");
    }
  };

  if (!currentDeck) {
    return (
      <div className="p-12 text-center text-sm font-bold text-slate-500">
        Đang tải Sổ Từ Vựng Học Thuật...
      </div>
    );
  }

  const masteredInDeck = words.filter(
    (w) => progress[w.id] === "MASTERED"
  ).length;

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#1d4ed8] px-6 py-5 text-white shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
            <BookMarked className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Sổ Từ Vựng Học Thuật & Luyện Phản Xạ
            </span>
            <h1 className="mt-1 text-xl font-extrabold">
              Kho Từ Vựng Theo Bài Đọc Reading, Listening & Thi Xếp Lớp
            </h1>
          </div>
        </div>

        <div className="rounded-xl bg-white/15 px-4 py-2.5 text-right backdrop-blur-xs">
          <p className="text-[11px] text-sky-100">Tiến độ bộ từ hiện tại</p>
          <p className="text-base font-black text-amber-300">
            Đã thuộc {masteredInDeck} / {words.length} từ
          </p>
        </div>
      </div>

      {/* Deck Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {decks.map((deck) => {
          const isSelected = deck.id === currentDeck.id;
          return (
            <button
              key={deck.id}
              onClick={() => {
                setSelectedDeckId(deck.id);
                setCardIndex(0);
                setIsFlipped(false);
                setQuizIndex(0);
                setQuizScore(0);
                setQuizFinished(false);
                setSelectedQuizOption(null);
                setDictationIndex(0);
                setDictationInput("");
                setDictationFeedback(null);
              }}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                isSelected
                  ? "border-[#0284c7] bg-[#eff6ff] shadow-xs ring-2 ring-[#0284c7]/20"
                  : "border-slate-200 bg-white hover:border-sky-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-[#0284c7] px-2 py-0.5 text-[10px] font-bold text-white">
                    {deck.category}
                  </span>
                  <span className="text-[11px] font-bold text-[#1d4ed8]">
                    {deck.level}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-extrabold text-slate-900">
                  {deck.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                  {deck.description}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-sky-200/60 pt-2.5 text-[11px] font-bold text-[#0284c7]">
                <span>{deck.words.length} từ vựng trọng tâm</span>
                {deck.linkedTestId && (
                  <Link
                    href={`/exam/${deck.linkedTestId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[#1d4ed8] hover:underline"
                  >
                    <span>Làm bài đọc gốc</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "LIST", label: "Danh sách từ vựng", icon: List },
            { id: "FLASHCARD", label: "Flashcard Lật 2 Mặt", icon: Layers },
            {
              id: "QUIZ",
              label: "Trắc nghiệm 4 đáp án",
              icon: HelpCircle,
            },
            {
              id: "DICTATION",
              label: "Nghe - Chép chính tả (Dictation)",
              icon: Keyboard,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id as PracticeMode)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                  active
                    ? "bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] text-white shadow-xs"
                    : "text-slate-600 hover:bg-[#eff6ff] hover:text-[#0284c7]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODE 1: WORD LIST                                                   */}
      {/* =================================================================== */}
      {mode === "LIST" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {words.map((w) => {
            const st = progress[w.id] || "NEW";
            return (
              <div
                key={w.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#0284c7] transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-black text-[#1d4ed8]">
                        {w.word}
                      </h3>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold italic text-slate-600">
                        {w.partOfSpeech}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {w.phonetics}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakWord(w.word)}
                        className="rounded-full bg-[#eff6ff] p-1.5 text-[#0284c7] hover:bg-[#0284c7] hover:text-white transition"
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        updateWordStatus(
                          w.id,
                          st === "MASTERED" ? "LEARNING" : "MASTERED"
                        )
                      }
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold transition ${
                        st === "MASTERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-[#0284c7]"
                      }`}
                    >
                      {st === "MASTERED" ? "✓ Đã thuộc" : "Đánh dấu Đã thuộc"}
                    </button>
                  </div>

                  <p className="mt-2 text-sm font-bold text-slate-900">
                    🇻🇳 {w.meaningVi}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    🇬🇧 {w.definitionEn}
                  </p>

                  <div className="mt-3 rounded-xl bg-[#eff6ff]/70 p-3 text-xs border border-sky-100">
                    <p className="font-semibold text-slate-800 italic">
                      &ldquo;{w.exampleEn}&rdquo;
                    </p>
                    <p className="mt-0.5 text-slate-500">{w.exampleVi}</p>
                  </div>
                </div>

                {w.synonyms.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-400">Synonyms:</span>
                    {w.synonyms.map((syn) => (
                      <span
                        key={syn}
                        className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODE 2: INTERACTIVE FLASHCARD FLIP                                  */}
      {/* =================================================================== */}
      {mode === "FLASHCARD" && words[cardIndex] && (
        <div className="mx-auto max-w-xl space-y-4">
          <div
            onClick={() => setIsFlipped((f) => !f)}
            className="cursor-pointer rounded-3xl border-2 border-[#0284c7]/30 bg-white p-8 text-center shadow-lg hover:border-[#0284c7] transition min-h-[300px] flex flex-col items-center justify-center"
          >
            <span className="mb-3 rounded-full bg-[#eff6ff] px-3 py-1 text-[11px] font-bold text-[#0284c7]">
              Thẻ {cardIndex + 1} / {words.length} • Nhấn vào thẻ để lật mặt sau
            </span>

            {!isFlipped ? (
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-[#1d4ed8]">
                  {words[cardIndex].word}
                </h2>
                <p className="text-sm font-mono text-slate-500">
                  {words[cardIndex].partOfSpeech} • {words[cardIndex].phonetics}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakWord(words[cardIndex].word);
                  }}
                  className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-[#0284c7] px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  <Volume2 className="h-4 w-4" />
                  Nghe phát âm
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                <p className="text-xl font-extrabold text-[#0284c7]">
                  {words[cardIndex].meaningVi}
                </p>
                <p className="text-xs text-slate-600">
                  {words[cardIndex].definitionEn}
                </p>
                <div className="rounded-xl bg-[#eff6ff] p-3 text-xs italic text-slate-700">
                  &ldquo;{words[cardIndex].exampleEn}&rdquo;
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setCardIndex((i) => Math.max(0, i - 1));
                setIsFlipped(false);
              }}
              disabled={cardIndex === 0}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Từ trước
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  updateWordStatus(words[cardIndex].id, "LEARNING");
                  setIsFlipped(false);
                  if (cardIndex + 1 < words.length) setCardIndex((i) => i + 1);
                }}
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800"
              >
                Cần ôn lại
              </button>
              <button
                onClick={() => {
                  updateWordStatus(words[cardIndex].id, "MASTERED");
                  setIsFlipped(false);
                  if (cardIndex + 1 < words.length) setCardIndex((i) => i + 1);
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs"
              >
                ✓ Đã thuộc từ này
              </button>
            </div>

            <button
              onClick={() => {
                setCardIndex((i) => Math.min(words.length - 1, i + 1));
                setIsFlipped(false);
              }}
              disabled={cardIndex === words.length - 1}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-40"
            >
              Từ tiếp
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODE 3: 4-OPTION MULTIPLE CHOICE QUIZ                               */}
      {/* =================================================================== */}
      {mode === "QUIZ" && (
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          {quizFinished ? (
            <div className="text-center space-y-4 py-6">
              <Sparkles className="mx-auto h-12 w-12 text-[#0284c7]" />
              <h3 className="text-xl font-extrabold text-slate-900">
                Hoàn thành Trắc nghiệm Từ vựng!
              </h3>
              <p className="text-sm text-slate-600">
                Bạn đạt{" "}
                <strong className="text-[#0284c7] text-lg">
                  {quizScore} / {words.length}
                </strong>{" "}
                câu trả lời chính xác.
              </p>
              <button
                onClick={() => {
                  setQuizIndex(0);
                  setQuizScore(0);
                  setQuizFinished(false);
                  setSelectedQuizOption(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0284c7] px-5 py-2.5 text-xs font-bold text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Làm lại bài Quiz
              </button>
            </div>
          ) : (
            currentQuizWord && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    Câu hỏi {quizIndex + 1} / {words.length}
                  </span>
                  <span className="text-[#0284c7]">
                    Điểm hiện tại: {quizScore}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#eff6ff] p-5 text-center border border-sky-100">
                  <p className="text-xs font-semibold text-slate-500">
                    Chọn nghĩa tiếng Việt chính xác nhất cho từ:
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <h3 className="text-2xl font-black text-[#1d4ed8]">
                      {currentQuizWord.word}
                    </h3>
                    <button
                      type="button"
                      onClick={() => speakWord(currentQuizWord.word)}
                      className="rounded-full bg-white p-1.5 text-[#0284c7] shadow-2xs"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    {currentQuizWord.partOfSpeech} • {currentQuizWord.phonetics}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {quizOptions.map((opt, idx) => {
                    const isSelected = selectedQuizOption === opt;
                    const isCorrect = opt === currentQuizWord.meaningVi;

                    let style =
                      "border-slate-200 bg-white text-slate-800 hover:border-[#0284c7]";
                    if (selectedQuizOption) {
                      if (isCorrect) {
                        style =
                          "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                      } else if (isSelected) {
                        style = "border-red-400 bg-red-50 text-red-800";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectQuizOption(opt)}
                        disabled={Boolean(selectedQuizOption)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-semibold transition ${style}`}
                      >
                        <span>
                          {String.fromCharCode(65 + idx)}. {opt}
                        </span>
                        {selectedQuizOption && isCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        {selectedQuizOption && isSelected && !isCorrect && (
                          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedQuizOption && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNextQuiz}
                      className="rounded-xl bg-[#0284c7] px-5 py-2 text-xs font-bold text-white"
                    >
                      {quizIndex + 1 >= words.length
                        ? "Xem tổng kết Quiz"
                        : "Câu tiếp theo →"}
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODE 4: LISTENING & TYPING DICTATION ("NGHE - CHÉP CHÍNH TẢ")       */}
      {/* =================================================================== */}
      {mode === "DICTATION" && currentDictationWord && (
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              Bài nghe chính tả {dictationIndex + 1} / {words.length}
            </span>
            <span className="text-[#0284c7]">
              Chấm tự động chuẩn hóa chữ hoa/thường
            </span>
          </div>

          <div className="rounded-2xl bg-[#eff6ff] p-6 text-center space-y-3 border border-sky-100">
            <button
              type="button"
              onClick={() => speakWord(currentDictationWord.word)}
              className="mx-auto flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-6 py-3 text-xs font-extrabold text-white shadow-md hover:opacity-95 transition"
            >
              <Volume2 className="h-5 w-5" />
              <span>Nhấn để Nghe Phát Âm Từ Vựng</span>
            </button>

            <p className="text-xs font-mono text-slate-600">
              Gợi ý phiên âm: <strong>{currentDictationWord.phonetics}</strong> (
              {currentDictationWord.partOfSpeech})
            </p>
            <p className="text-sm font-bold text-slate-800">
              Nghĩa tiếng Việt: {currentDictationWord.meaningVi}
            </p>
          </div>

          <form onSubmit={handleCheckDictation} className="space-y-3">
            <input
              type="text"
              value={dictationInput}
              onChange={(e) => {
                setDictationInput(e.target.value);
                setDictationFeedback(null);
              }}
              placeholder="Gõ chính xác từ tiếng Anh bạn nghe được..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-bold text-[#1d4ed8] focus:border-[#0284c7] focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#0284c7] py-2.5 text-xs font-extrabold text-white hover:bg-[#1d4ed8] transition"
              >
                Kiểm tra chính tả
              </button>
              <button
                type="button"
                onClick={() => {
                  setDictationInput("");
                  setDictationFeedback(null);
                  setDictationIndex((i) => (i + 1) % words.length);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Từ tiếp theo →
              </button>
            </div>
          </form>

          {dictationFeedback && (
            <div
              className={`rounded-xl p-3.5 text-xs font-bold ${
                dictationFeedback === "CORRECT"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {dictationFeedback === "CORRECT" ? (
                <span>
                  🎉 Chính xác tuyệt đối! Từ chuẩn là{" "}
                  <strong className="underline">
                    {currentDictationWord.word}
                  </strong>
                  .
                </span>
              ) : (
                <span>
                  ❌ Chưa chính xác. Đáp án đúng là:{" "}
                  <strong className="underline text-sm">
                    {currentDictationWord.word}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
