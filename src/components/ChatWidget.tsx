"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Headset,
  MessageCircle,
  Minimize2,
  Send,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ChatThreadItem } from "@/lib/types";

export default function ChatWidget() {
  const { currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [thread, setThread] = useState<ChatThreadItem | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?threadId=thread-student-1");
      if (res.ok) {
        const data = await res.json();
        setThread(data.thread);
      }
    } catch {
      // Ignore network polling errors
    }
  }, []);

  useEffect(() => {
    fetchThread();
    const timer = setInterval(fetchThread, 5000);
    return () => clearInterval(timer);
  }, [fetchThread]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, thread?.messages.length]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || sending) return;

    setSending(true);
    if (!customText) setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread?.id || "thread-student-1",
          senderRole: "STUDENT",
          senderName: currentUser.fullName,
          content: textToSend,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setThread(data.thread);
      }
    } finally {
      setSending(false);
    }
  };

  const handleRequestHumanStaff = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread?.id || "thread-student-1",
          action: "REQUEST_HUMAN",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setThread(data.thread);
      }
    } finally {
      setSending(false);
    }
  };

  const handleReturnToAi = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread?.id || "thread-student-1",
          action: "RETURN_TO_AI",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setThread(data.thread);
      }
    } finally {
      setSending(false);
    }
  };

  const status = thread?.status || "AI_ACTIVE";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2.5">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-2 flex h-[510px] w-[360px] sm:w-[395px] flex-col overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-4 py-3.5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  {status === "AI_ACTIVE" ? (
                    <Bot className="h-5 w-5 text-white" />
                  ) : (
                    <Headset className="h-5 w-5 text-amber-300" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-tight">
                    Tư Vấn Trực Tuyến BluePass
                  </h4>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-sky-100">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        status === "AI_ACTIVE"
                          ? "bg-emerald-400"
                          : status === "NEEDS_HUMAN"
                          ? "bg-amber-400 animate-pulse"
                          : "bg-sky-300"
                      }`}
                    />
                    <span>
                      {status === "AI_ACTIVE"
                        ? "Trợ lý AI Phản hồi tức thì"
                        : status === "NEEDS_HUMAN"
                        ? "Đang kết nối Nhân viên (NEEDS_HUMAN)"
                        : `Đang chat với ${thread?.assignedStaffName || "Tư vấn viên"}`}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-white/15 p-1.5 hover:bg-white/25 transition"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Handoff Action Bar */}
            <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs">
              {status === "AI_ACTIVE" ? (
                <>
                  <span className="text-[11px] text-sky-100">
                    Cần hỗ trợ xếp lớp / đổi lịch?
                  </span>
                  <button
                    onClick={handleRequestHumanStaff}
                    className="flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm hover:bg-amber-300 transition"
                  >
                    <Headset className="h-3.5 w-3.5" />
                    Gặp nhân viên tư vấn
                  </button>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-200">
                    <UserCheck className="h-3.5 w-3.5" />
                    Đã chuyển sang Hộp thư Nhân viên
                  </span>
                  <button
                    onClick={handleReturnToAi}
                    className="rounded-lg bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-white/30 transition"
                  >
                    Bật lại AI
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#eff6ff]/50 p-3.5">
            {thread?.messages.map((msg) => {
              const isStudent = msg.senderRole === "STUDENT";
              const isStaff = msg.senderRole === "STAFF";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isStudent ? "items-end" : "items-start"
                  }`}
                >
                  <span className="mb-1 px-1 text-[10px] font-semibold text-slate-400">
                    {msg.senderName} •{" "}
                    {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                      isStudent
                        ? "bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] text-white rounded-br-xs"
                        : isStaff
                        ? "border-2 border-amber-300 bg-amber-50 text-slate-800 rounded-bl-xs"
                        : "border border-sky-100 bg-white text-slate-700 rounded-bl-xs"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-slate-50 px-3 py-2 no-scrollbar">
            {[
              "Học phí & Lộ trình",
              "Quy chế Thi Xếp Lớp",
              "Sổ Từ Vựng",
              "Xin đổi lịch học",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSend(chip)}
                className="flex items-center gap-1 whitespace-nowrap rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0284c7] hover:bg-[#eff6ff] transition"
              >
                <Sparkles className="h-3 w-3" />
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi hoặc nhắn nhân viên..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#0284c7] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0284c7] text-white shadow-sm hover:bg-[#1d4ed8] transition disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Button (Replicating Bottom-Right Blue Chat Bubble from Screenshot) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-4 py-3 text-white shadow-xl hover:scale-105 transition"
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-300 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400"></span>
          </span>
        </div>
        <div className="text-left pr-1">
          <p className="text-xs font-extrabold leading-none">
            Chat AI & Tư Vấn Viên
          </p>
          <p className="text-[10px] text-sky-100 leading-tight mt-0.5">
            {status === "NEEDS_HUMAN"
              ? "Đang chờ nhân viên..."
              : "Hỗ trợ 24/7 • Gặp nhân viên"}
          </p>
        </div>
      </button>
    </div>
  );
}
