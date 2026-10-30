"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  FileSpreadsheet,
  FolderKanban,
  Headset,
  Lock,
  Megaphone,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Trophy,
  UploadCloud,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  AnnouncementCategory,
  AnnouncementItem,
  ChatThreadItem,
  PlacementRow,
  QuestionType,
  Role,
  Skill,
  TestMode,
  TestSource,
  UserProfile,
} from "@/lib/types";

interface RankedSubmission {
  rank: number;
  attemptId: string;
  studentCode: string;
  fullName: string;
  email: string;
  testId: string;
  testTitle: string;
  skill: string;
  isPlacement: boolean;
  rawScore: number;
  totalQuestions: number;
  percentageScore: number;
  bandScore: number;
  timeSpentSeconds: number;
  tabSwitchCount: number;
  suggestedClass: string;
  antiCheatFlag: string;
  submittedAt: string;
}

interface AdminTestSummary {
  id: string;
  slug: string;
  title: string;
  skill: Skill;
  mode: TestMode;
  passageNumber: number | null;
  source: TestSource;
  durationMinutes: number;
  totalQuestions: number;
  attemptCount: number;
  questionTypesSummary: string[];
  isPlacement: boolean;
}

type AdminTab =
  | "rankings"
  | "manage-tests"
  | "publish"
  | "chat-inbox"
  | "vps-db"
  | "telegram";

/**
 * Converts plain text paragraphs (copied from Word/PDF/Cambridge books)
 * into clean IELTS Reading HTML with Paragraph A, B, C... labels automatically!
 */
function convertPlainTextToIeltsPassageHtml(
  title: string,
  plainText: string
): string {
  const paragraphs = plainText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const formattedParagraphs = paragraphs.map((p, idx) => {
    const letter = String.fromCharCode(65 + idx);
    // If the user already started with "A." or "Paragraph A", keep it clean
    if (/^(Paragraph\s+[A-Z]|[A-Z]\.)/i.test(p)) {
      return `<p><strong>${p.slice(0, 2)}</strong>${p.slice(2)}</p>`;
    }
    return `<p><strong>Paragraph ${letter}.</strong> ${p}</p>`;
  });

  return `<div class="space-y-4 leading-relaxed text-slate-800"><h2 class="text-xl font-bold text-slate-900">${title}</h2>${formattedParagraphs.join(
    ""
  )}</div>`;
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const {
    currentUser,
    setCurrentUser,
    setIsAuthModalOpen,
    setUnreadAnnouncementsCount,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>("rankings");

  // Tab 1: Rankings State
  const [rankings, setRankings] = useState<RankedSubmission[]>([]);
  const [availableTests, setAvailableTests] = useState<
    { id: string; title: string; isPlacement: boolean }[]
  >([]);
  const [filterTestId, setFilterTestId] = useState<string>("ALL");
  const [onlyPlacement, setOnlyPlacement] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingRankings, setLoadingRankings] = useState<boolean>(true);

  // Tab 2: Manage & Upload/Delete Tests State (Plain Text from Word/PDF + Live Split-Screen Preview)
  const [allTestsList, setAllTestsList] = useState<AdminTestSummary[]>([]);
  const [showCreateTestForm, setShowCreateTestForm] = useState<boolean>(false);
  const [showLiveStudentPreview, setShowLiveStudentPreview] =
    useState<boolean>(true);
  const [newTestTitle, setNewTestTitle] = useState(
    "[BluePass Collect] - The Future of Renewable Aviation"
  );
  const [newTestSkill, setNewTestSkill] = useState<Skill>("READING");
  const [newTestMode, setNewTestMode] = useState<TestMode>("SINGLE_PASSAGE");
  const [newTestPassageNum, setNewTestPassageNum] = useState<number>(1);
  const [newTestSource, setNewTestSource] = useState<TestSource>("COLLECT_REAL");
  const [newTestDuration, setNewTestDuration] = useState<number>(20);
  const [newTestIsPlacement, setNewTestIsPlacement] = useState<boolean>(false);
  const [newTestThumbnail, setNewTestThumbnail] = useState(
    "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80"
  );
  // Plain text input so Admin/Teachers can copy-paste straight from Word/PDF without writing HTML!
  const [newTestPlainText, setNewTestPlainText] = useState(
    `Aerospace engineers are developing hydrogen-powered turbines and sustainable aviation fuels synthesized from agricultural waste to cut global carbon emissions by 80% before 2050.\n\nShort-haul regional aircraft equipped with lightweight lithium-sulfur batteries are already completing commercial test flights across Scandinavia.`
  );
  const [newTestQType, setNewTestQType] = useState<QuestionType>("GAP_FILL");
  const [newTestQuestions, setNewTestQuestions] = useState<
    {
      prompt: string;
      correctAnswer: string;
      explanation: string;
      optionsText?: string;
    }[]
  >([
    {
      prompt:
        "Sustainable aviation fuels aim to reduce global carbon ________ by 80% before 2050.",
      correctAnswer: "emissions|emission",
      explanation:
        "Đoạn A: '...to cut global carbon emissions by 80% before 2050.'",
    },
    {
      prompt:
        "Regional planes in Scandinavia are testing lightweight lithium-sulfur ________.",
      correctAnswer: "batteries|battery",
      explanation:
        "Đoạn B: '...equipped with lightweight lithium-sulfur batteries...'",
    },
  ]);
  const [testActionNotice, setTestActionNotice] = useState<string | null>(null);
  const [isSavingTest, setIsSavingTest] = useState(false);

  // Tab 3: Manual Announcement Editor State
  const [annTitle, setAnnTitle] = useState(
    "[CHÍNH THỨC] Thông báo Danh sách Xếp lớp & Lịch học Khóa IELTS Intensive Đợt 2/2026"
  );
  const [annCategory, setAnnCategory] =
    useState<AnnouncementCategory>("PLACEMENT_RESULT");
  const [annSender, setAnnSender] = useState("Phòng Đào Tạo & Khảo Thí");
  const [annAttachmentName, setAnnAttachmentName] = useState(
    "Bang_Xep_Lop_Chinh_Thuc_Dot2_2026.csv"
  );
  const [annIsPinned, setAnnIsPinned] = useState(true);
  const [annContentHtml, setAnnContentHtml] = useState(
    `<p>Căn cứ kết quả chấm thi tự động trên hệ thống <strong>BluePass</strong> và biên bản rà soát dữ liệu chống gian lận (Anti-Cheat Tab-Switch), Hội đồng Đào tạo công bố danh sách xếp lớp chính thức dưới đây.</p><p>Học viên kiểm tra Mã Học Viên (MSSV), lớp được phân và lịch khai giảng tương ứng.</p>`
  );
  const [placementRows, setPlacementRows] = useState<PlacementRow[]>([]);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Tab 4: Staff Live Chat Inbox State
  const [chatThreads, setChatThreads] = useState<ChatThreadItem[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    "thread-needs-human-1"
  );
  const [staffReplyInput, setStaffReplyInput] = useState<string>("");
  const [needsHumanCount, setNeedsHumanCount] = useState<number>(0);

  // Tab 3 & Tab 5: Announcements List & RBAC Users Management State
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<
    AnnouncementItem[]
  >([]);
  const [adminUsers, setAdminUsers] = useState<
    (UserProfile & { attemptCount?: number })[]
  >([]);
  const [userRbacNotice, setUserRbacNotice] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("tab") as AdminTab | null;
    if (
      t &&
      [
        "rankings",
        "manage-tests",
        "publish",
        "chat-inbox",
        "vps-db",
        "telegram",
      ].includes(t)
    ) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const fetchRankings = useCallback(async () => {
    setLoadingRankings(true);
    try {
      const params = new URLSearchParams();
      if (filterTestId !== "ALL") params.set("testId", filterTestId);
      if (onlyPlacement) params.set("onlyPlacement", "true");
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/admin/rankings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data.rankings || []);
        setAvailableTests(data.availableTests || []);
      }
    } finally {
      setLoadingRankings(false);
    }
  }, [filterTestId, onlyPlacement, searchQuery]);

  const fetchAllTestsForAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/tests");
      if (res.ok) {
        const data = await res.json();
        setAllTestsList(data.tests || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  const fetchAnnouncementsForAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setPublishedAnnouncements(data.announcements || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  const fetchUsersForAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.users || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchRankings();
    fetchAllTestsForAdmin();
    fetchAnnouncementsForAdmin();
    fetchUsersForAdmin();
  }, [
    fetchRankings,
    fetchAllTestsForAdmin,
    fetchAnnouncementsForAdmin,
    fetchUsersForAdmin,
  ]);

  const fetchStaffChatInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?mode=staff");
      if (res.ok) {
        const data = await res.json();
        setChatThreads(data.threads || []);
        setNeedsHumanCount(data.needsHumanCount || 0);
      }
    } catch {
      // Ignore polling error
    }
  }, []);

  useEffect(() => {
    fetchStaffChatInbox();
    const timer = setInterval(fetchStaffChatInbox, 4000);
    return () => clearInterval(timer);
  }, [fetchStaffChatInbox]);

  // Telegram Bot Integration State
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [tgBotUsername, setTgBotUsername] = useState("");
  const [tgEnabled, setTgEnabled] = useState(true);
  const [tgNotifySubmit, setTgNotifySubmit] = useState(true);
  const [tgNotifyRegister, setTgNotifyRegister] = useState(true);
  const [tgNotifyChat, setTgNotifyChat] = useState(true);
  const [tgLogs, setTgLogs] = useState<
    { id: string; timestamp: string; direction: "INCOMING" | "OUTGOING"; text: string }[]
  >([]);
  const [tgNotice, setTgNotice] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);

  const fetchTelegramStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram");
      if (res.ok) {
        const data = await res.json();
        if (data.botToken && !tgBotToken) setTgBotToken(data.botToken);
        if (data.adminChatId) setTgChatId(data.adminChatId);
        if (data.botUsername) setTgBotUsername(data.botUsername);
        setTgEnabled(data.enabled ?? true);
        setTgNotifySubmit(data.notifyOnSubmit ?? true);
        setTgNotifyRegister(data.notifyOnRegister ?? true);
        setTgNotifyChat(data.notifyOnChat ?? true);
        setTgLogs(data.logs || []);
      }
    } catch {
      // Ignore
    }
  }, [tgBotToken]);

  useEffect(() => {
    fetchTelegramStatus();
    const timer = setInterval(fetchTelegramStatus, 5000);
    return () => clearInterval(timer);
  }, [fetchTelegramStatus]);

  const handleSaveTelegramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgLoading(true);
    setTgNotice(null);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          botToken: tgBotToken,
          adminChatId: tgChatId,
          enabled: tgEnabled,
          notifyOnSubmit: tgNotifySubmit,
          notifyOnRegister: tgNotifyRegister,
          notifyOnChat: tgNotifyChat,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTgNotice(`✅ ${data.message}`);
        if (data.state?.adminChatId) setTgChatId(data.state.adminChatId);
        if (data.state?.botUsername) setTgBotUsername(data.state.botUsername);
        if (data.state?.logs) setTgLogs(data.state.logs);
      } else {
        setTgNotice(`❌ ${data.error}`);
      }
    } finally {
      setTgLoading(false);
    }
  };

  const handleTestTelegramMessage = async () => {
    setTgLoading(true);
    setTgNotice(null);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (res.ok) {
        setTgNotice(`🔔 ${data.message}`);
        if (data.logs) setTgLogs(data.logs);
      } else {
        setTgNotice(`❌ ${data.error}`);
      }
    } finally {
      setTgLoading(false);
    }
  };

  const generatedPreviewHtml = useMemo(
    () => convertPlainTextToIeltsPassageHtml(newTestTitle, newTestPlainText),
    [newTestTitle, newTestPlainText]
  );

  // Quick helper to switch to Admin account right from the 403 Guard Screen
  const handleLoginAsAdminInstant = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@bluepass.edu.vn",
        password: "123456",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
    }
  };

  // =========================================================================
  // STRICT RBAC GUARD: BLOCK STUDENTS FROM ACCESSING `/admin`
  // =========================================================================
  if (currentUser.role === "STUDENT") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border-2 border-red-200 bg-white p-8 text-center shadow-xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <Lock className="h-8 w-8" />
          </div>
          <div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-extrabold text-red-700">
              403 FORBIDDEN — PHÂN TẦNG BẢO MẬT DỮ LIỆU (RBAC)
            </span>
            <h1 className="mt-3 text-xl font-black text-slate-900">
              Khu Vực Này Chỉ Dành Cho Quản Trị Viên (Admin) & Giáo Viên!
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
              Bạn đang đăng nhập dưới quyền{" "}
              <strong className="text-[#0284c7]">
                HỌC VIÊN ({currentUser.fullName} — {currentUser.studentCode})
              </strong>
              . Học viên hoàn toàn <strong>không có quyền</strong> truy cập Bảng
              Quản Trị, không thể đăng tải hay xóa đề thi, và không thể tự đăng
              thông báo xếp lớp.
            </p>
          </div>

          <div className="rounded-2xl bg-[#eff6ff] p-4 text-left text-xs text-slate-700 border border-sky-200 space-y-1.5">
            <p className="font-extrabold text-[#1d4ed8]">
              🔑 Dành cho Chủ trang web (Bạn):
            </p>
            <p>
              Mình đã tạo sẵn tài khoản <strong>Admin Chủ Web</strong> cho bạn
              (<code className="font-mono font-bold">admin@bluepass.edu.vn</code>{" "}
              / Mật khẩu: <code className="font-mono font-bold">123456</code>).
              Hãy bấm nút màu vàng bên dưới để đăng nhập vào quyền Admin ngay!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              ← Quay về Trang Luyện Đề Học Viên
            </Link>
            <button
              onClick={handleLoginAsAdminInstant}
              className="rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-black text-slate-950 shadow-md hover:bg-amber-300 transition"
            >
              👑 Đăng Nhập Ngay Tài Khoản ADMIN Của Bạn
            </button>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="rounded-xl bg-[#0284c7] px-5 py-2.5 text-xs font-bold text-white"
            >
              Mở Hộp Thoại Đăng Nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create / Upload a new Test from Admin UI
  const handleCreateNewTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTest(true);
    setTestActionNotice(null);

    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          title: newTestTitle,
          skill: newTestSkill,
          mode: newTestMode,
          passageNumber: newTestPassageNum,
          source: newTestSource,
          durationMinutes: newTestDuration,
          thumbnailUrl: newTestThumbnail,
          isPlacement: newTestIsPlacement,
          passageHtml: generatedPreviewHtml,
          questionType: newTestQType,
          questions: newTestQuestions,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestActionNotice(
          `✅ Đã đăng tải đề thi "${data.test.title}" lên hệ thống thành công!`
        );
        setShowCreateTestForm(false);
        fetchAllTestsForAdmin();
        fetchRankings();
      } else {
        setTestActionNotice(`❌ ${data.error}`);
      }
    } finally {
      setIsSavingTest(false);
    }
  };

  // Delete a Test from Admin UI
  const handleDeleteTest = async (id: string, title: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${title}" không?`)
    ) {
      return;
    }

    const res = await fetch(`/api/tests?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "x-user-id": currentUser.id,
      },
    });
    const data = await res.json();
    if (res.ok) {
      setTestActionNotice(`🗑️ ${data.message}`);
      fetchAllTestsForAdmin();
      fetchRankings();
    } else {
      setTestActionNotice(`❌ ${data.error}`);
    }
  };

  const handleImportRankingsToAnnouncement = () => {
    const converted: PlacementRow[] = rankings.map((r) => ({
      studentCode: r.studentCode,
      fullName: r.fullName,
      score: `${r.rawScore}/${r.totalQuestions} (${r.percentageScore}%)`,
      band: r.bandScore.toFixed(1),
      assignedClass:
        r.tabSwitchCount >= 5
          ? "Huỷ kết quả / Yêu cầu thi lại (Vi phạm chuyển tab)"
          : r.suggestedClass,
      schedule:
        r.percentageScore >= 70
          ? "Thứ 2 - 4 - 6 (18:30 - 20:30)"
          : "Thứ 3 - 5 - 7 (18:30 - 20:30)",
      room: r.percentageScore >= 70 ? "P. B1-302" : "P. A2-105",
      status:
        r.tabSwitchCount >= 5 || r.percentageScore < 40
          ? "LOẠI / THI LẠI"
          : r.percentageScore < 60
          ? "CẦN HỌC BỔ TRỢ"
          : "ĐẠT - XẾP LỚP",
    }));

    setPlacementRows(converted);
    setActiveTab("publish");
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setPublishSuccess(null);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          title: annTitle,
          category: annCategory,
          senderName: annSender,
          attachmentName: annAttachmentName,
          attachmentUrl: "/api/admin/rankings?format=csv",
          contentHtml: annContentHtml,
          placementData: placementRows,
          isPinned: annIsPinned,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPublishSuccess(
          "🎉 Đã đăng Thông báo & Danh sách Xếp lớp chính thức lên Cổng Thông Tin Học Viên (UEH Portal)!"
        );
        setUnreadAnnouncementsCount(3);
        fetchAnnouncementsForAdmin();
      } else {
        setPublishSuccess(`❌ ${data.error}`);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Bạn có chắc chắn muốn xóa thông báo "${title}" không?`)
    ) {
      return;
    }
    const res = await fetch(
      `/api/announcements?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (res.ok) {
      setPublishSuccess(`🗑️ ${data.message}`);
      fetchAnnouncementsForAdmin();
    } else {
      setPublishSuccess(`❌ ${data.error}`);
    }
  };

  const handleDeleteAttempt = async (attemptId: string, studentName: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Xóa lượt thi của học viên "${studentName}" khỏi Bảng Xếp Hạng?`
      )
    ) {
      return;
    }
    const res = await fetch(
      `/api/admin/rankings?attemptId=${encodeURIComponent(attemptId)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      fetchRankings();
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: Role) => {
    setUserRbacNotice(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    const data = await res.json();
    if (res.ok) {
      setUserRbacNotice(`✅ ${data.message}`);
      fetchUsersForAdmin();
    } else {
      setUserRbacNotice(`❌ ${data.error}`);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Xóa vĩnh viễn tài khoản "${fullName}" khỏi hệ thống?`)
    ) {
      return;
    }
    setUserRbacNotice(null);
    const res = await fetch(
      `/api/admin/users?id=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (res.ok) {
      setUserRbacNotice(`🗑️ ${data.message}`);
      fetchUsersForAdmin();
    } else {
      setUserRbacNotice(`❌ ${data.error}`);
    }
  };

  const selectedChatThread =
    chatThreads.find((t) => t.id === selectedThreadId) || chatThreads[0];

  const handleStaffTakeover = async (threadId: string) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        action: "STAFF_TAKEOVER",
        senderName: currentUser.fullName,
      }),
    });
    if (res.ok) {
      fetchStaffChatInbox();
    }
  };

  const handleSendStaffReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffReplyInput.trim() || !selectedChatThread) return;
    const text = staffReplyInput.trim();
    setStaffReplyInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: selectedChatThread.id,
        senderRole: "STAFF",
        senderName: `${currentUser.fullName} (Phòng Đào Tạo)`,
        content: text,
      }),
    });
    if (res.ok) {
      fetchStaffChatInbox();
    }
  };

  const csvDownloadUrl = `/api/admin/rankings?format=csv&testId=${filterTestId}&onlyPlacement=${onlyPlacement}&q=${encodeURIComponent(
    searchQuery
  )}`;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-6">
      {/* Top Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#0284c7] px-6 py-5 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-200">
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            Trung Tâm Quản Trị ({currentUser.role}: {currentUser.fullName})
          </div>
          <h1 className="mt-1 text-xl font-extrabold">
            Bảng Xếp Hạng Xuất Excel • Đăng Tải / Xóa Đề Thi • Công Bố Xếp Lớp
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {currentUser.role === "ADMIN" && (
            <button
              onClick={() => {
                setActiveTab("manage-tests");
                setShowCreateTestForm(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#1d4ed8] shadow-md hover:bg-sky-50 transition"
            >
              <UploadCloud className="h-4 w-4" />
              <span>+ Đăng Tải Đề Thi Mới</span>
            </button>
          )}

          <a
            href={csvDownloadUrl}
            className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md hover:bg-amber-300 transition"
          >
            <Download className="h-4 w-4" />
            <span>Xuất Điểm Học Sinh ra Excel (.CSV)</span>
          </a>
        </div>
      </div>

      {/* 3-Tier RBAC Matrix Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div
          className={`rounded-2xl border p-3.5 transition ${
            currentUser.role === "ADMIN"
              ? "border-amber-400 bg-amber-50/70 ring-2 ring-amber-300/40"
              : "border-slate-200 bg-white opacity-75"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-amber-900">
              👑 TẦNG 1: QUẢN TRỊ VIÊN (ADMIN)
            </span>
            {currentUser.role === "ADMIN" && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                ĐANG KÍCH HOẠT
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            Toàn quyền: Đăng/Xóa đề thi, Xóa lượt thi rác, Đăng/Xóa thông báo, Phân quyền tài khoản (RBAC), Cấu hình Bot Telegram & Gmail SMTP.
          </p>
        </div>

        <div
          className={`rounded-2xl border p-3.5 transition ${
            currentUser.role === "STAFF"
              ? "border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-300/40"
              : "border-slate-200 bg-white opacity-75"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-emerald-900">
              🎧 TẦNG 2: TƯ VẤN VIÊN / GIÁO VIÊN (STAFF)
            </span>
            {currentUser.role === "STAFF" && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                ĐANG KÍCH HOẠT
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            Quyền Đào tạo: Xem điểm & Xuất Excel, Đăng thông báo xếp lớp, Trả lời Hộp thư Tư vấn học viên. (Bị khóa quyền Xóa đề & Hệ thống).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 opacity-75">
          <div className="flex items-center justify-between">
            <span className="font-black text-[#0284c7]">
              🎓 TẦNG 3: HỌC VIÊN (STUDENT)
            </span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-700">
              CHẶN /ADMIN (403)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            Chỉ được làm bài thi, học từ vựng, xem thông báo & chat tư vấn. Tự động ẩn đáp án trước khi nộp bài và ẩn email học viên khác.
          </p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
        <button
          onClick={() => setActiveTab("rankings")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            activeTab === "rankings"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "text-slate-600 hover:bg-[#eff6ff] hover:text-[#0284c7]"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>1. Tổng Hợp Điểm & Xuất Excel ({rankings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("manage-tests")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            activeTab === "manage-tests"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "text-slate-600 hover:bg-[#eff6ff] hover:text-[#0284c7]"
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          <span>2. Quản Lý Đề Thi: Đăng Tải & Xóa Đề ({allTestsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("publish")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            activeTab === "publish"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "text-slate-600 hover:bg-[#eff6ff] hover:text-[#0284c7]"
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>3. Đăng Thông Báo Xếp Lớp Thủ Công (UEH Style)</span>
        </button>

        <button
          onClick={() => setActiveTab("chat-inbox")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            activeTab === "chat-inbox"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "text-slate-600 hover:bg-[#eff6ff] hover:text-[#0284c7]"
          }`}
        >
          <Headset className="h-4 w-4" />
          <span>4. Hộp Thư Tư Vấn Trực Tuyến</span>
          {needsHumanCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white animate-pulse">
              {needsHumanCount} cần nhân viên
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("vps-db")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            activeTab === "vps-db"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "text-slate-600 hover:bg-[#eff6ff] hover:text-[#0284c7]"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>5. Phân Quyền Tài Khoản (RBAC) & Database ({adminUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("telegram")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            activeTab === "telegram"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "text-slate-600 hover:bg-[#eff6ff] hover:text-[#0284c7]"
          }`}
        >
          <Send className="h-4 w-4" />
          <span>6. Kết Nối & Điều Khiển Qua Telegram</span>
          {tgBotUsername && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">
              @{tgBotUsername}
            </span>
          )}
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: ADMIN SCORE RANKING TABLE & EXCEL/CSV EXPORT                 */}
      {/* =================================================================== */}
      {activeTab === "rankings" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Lọc theo Đề Thi / Bài Kiểm Tra
                </label>
                <select
                  value={filterTestId}
                  onChange={(e) => setFilterTestId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#0284c7] focus:outline-none"
                >
                  <option value="ALL">Tất cả bài thi ({rankings.length})</option>
                  {availableTests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Tìm kiếm Học viên / Mã HV
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập tên hoặc HV-2026-..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold focus:border-[#0284c7] focus:outline-none"
                />
              </div>

              <label className="mt-5 flex cursor-pointer items-center gap-2 rounded-xl border border-sky-200 bg-[#eff6ff] px-3.5 py-2 text-xs font-bold text-[#1d4ed8]">
                <input
                  type="checkbox"
                  checked={onlyPlacement}
                  onChange={(e) => setOnlyPlacement(e.target.checked)}
                  className="h-4 w-4 accent-[#0284c7]"
                />
                <span>Chỉ hiện Đề Thi Xếp Lớp</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleImportRankingsToAnnouncement}
                className="flex items-center gap-1.5 rounded-xl border border-[#0284c7] bg-[#eff6ff] px-4 py-2.5 text-xs font-extrabold text-[#1d4ed8] hover:bg-[#0284c7] hover:text-white transition"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>Đưa danh sách này sang Soạn Thông Báo Xếp Lớp</span>
              </button>

              <a
                href={csvDownloadUrl}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Tải File Excel / CSV (.csv)</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff6ff] text-[#1d4ed8] font-extrabold uppercase">
                <tr>
                  <th className="px-3.5 py-3">Hạng</th>
                  <th className="px-3.5 py-3">Mã HV</th>
                  <th className="px-3.5 py-3">Họ và Tên</th>
                  <th className="px-3.5 py-3">Bài Thi</th>
                  <th className="px-3.5 py-3">Điểm Từ Cao → Thấp</th>
                  <th className="px-3.5 py-3">Band</th>
                  <th className="px-3.5 py-3">Thời Gian Hoàn Thành</th>
                  <th className="px-3.5 py-3">Giám Sát Chuyển Tab</th>
                  <th className="px-3.5 py-3">Lớp Gợi Ý</th>
                  {currentUser.role === "ADMIN" && (
                    <th className="px-3.5 py-3 text-right">Xóa</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loadingRankings ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-slate-500 font-semibold"
                    >
                      Đang tổng hợp bảng xếp hạng từ máy chủ...
                    </td>
                  </tr>
                ) : (
                  rankings.map((row) => (
                    <tr
                      key={row.attemptId}
                      className={`hover:bg-slate-50 ${
                        row.tabSwitchCount >= 4 ? "bg-red-50/40" : ""
                      }`}
                    >
                      <td className="px-3.5 py-3">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                            row.rank === 1
                              ? "bg-amber-400 text-slate-950"
                              : row.rank === 2
                              ? "bg-slate-300 text-slate-900"
                              : row.rank === 3
                              ? "bg-amber-700 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-mono font-bold text-[#0284c7]">
                        {row.studentCode}
                      </td>
                      <td className="px-3.5 py-3">
                        <p className="font-bold text-slate-900">{row.fullName}</p>
                        <p className="text-[11px] text-slate-400">{row.email}</p>
                      </td>
                      <td className="px-3.5 py-3 max-w-[230px] truncate font-medium text-slate-700">
                        {row.testTitle}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="text-sm font-black text-[#0284c7]">
                          {row.rawScore}/{row.totalQuestions}
                        </span>{" "}
                        <span className="font-bold text-slate-600">
                          ({row.percentageScore}%)
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-extrabold text-[#1d4ed8]">
                        {row.bandScore.toFixed(1)}
                      </td>
                      <td className="px-3.5 py-3 font-mono font-semibold text-slate-700">
                        {Math.floor(row.timeSpentSeconds / 60)}p{" "}
                        {row.timeSpentSeconds % 60}s ({row.timeSpentSeconds}s)
                      </td>
                      <td className="px-3.5 py-3">
                        {row.tabSwitchCount >= 4 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-extrabold text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            {row.tabSwitchCount} lần (Cảnh báo)
                          </span>
                        ) : row.tabSwitchCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                            <EyeOff className="h-3 w-3" />
                            {row.tabSwitchCount} lần
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            0 lần (Chuẩn)
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 font-bold text-slate-800">
                        {row.suggestedClass}
                      </td>
                      {currentUser.role === "ADMIN" && (
                        <td className="px-3.5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteAttempt(row.attemptId, row.fullName)
                            }
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                            title="Xóa lượt thi này (Chỉ ADMIN)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: QUẢN LÝ NGÂN HÀNG ĐỀ THI (PLAIN TEXT WORD PASTE + PREVIEW)   */}
      {/* =================================================================== */}
      {activeTab === "manage-tests" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#1d4ed8]">
                QUẢN LÝ NGÂN HÀNG ĐỀ THI (CHỈ TÀI KHOẢN ADMIN MỚI CÓ QUYỀN ĐĂNG / XÓA)
              </h2>
              <p className="text-xs text-slate-500">
                Copy-paste nội dung bài đọc bình thường từ file Word / PDF — Hệ thống tự động chia đoạn A, B, C và dựng giao diện phòng thi 2 cột cho học sinh!
              </p>
            </div>
            {currentUser.role === "ADMIN" ? (
              <button
                type="button"
                onClick={() => setShowCreateTestForm((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm"
              >
                <UploadCloud className="h-4 w-4" />
                <span>
                  {showCreateTestForm
                    ? "Đóng khung tạo đề mới"
                    : "+ Đăng Tải Đề Thi Mới"}
                </span>
              </button>
            ) : (
              <span className="rounded-xl bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-900">
                Chỉ ADMIN mới được phép thêm hoặc xóa đề thi
              </span>
            )}
          </div>

          {testActionNotice && (
            <div className="rounded-xl border border-sky-200 bg-[#eff6ff] px-4 py-3 text-xs font-bold text-[#1d4ed8]">
              {testActionNotice}
            </div>
          )}

          {/* Create / Upload New Exam Form with Live Split-Screen Student Preview */}
          {showCreateTestForm && currentUser.role === "ADMIN" && (
            <form
              onSubmit={handleCreateNewTest}
              className="rounded-2xl border-2 border-[#0284c7]/30 bg-[#eff6ff]/40 p-5 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-[#1d4ed8] flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Soạn Đề Thi Từ Văn Bản Word / PDF (Tự Động Chuyển Thành Giao Diện Phòng Thi)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLiveStudentPreview((p) => !p)}
                  className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-[#0284c7] border border-sky-200 shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>
                    {showLiveStudentPreview
                      ? "Đang bật: Xem trước Giao diện Học sinh làm bài"
                      : "Bật Xem trước Giao diện Học sinh"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên đề thi hiển thị ngoài Trang chủ *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kỹ năng
                  </label>
                  <select
                    value={newTestSkill}
                    onChange={(e) => setNewTestSkill(e.target.value as Skill)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-bold text-[#1d4ed8]"
                  >
                    <option value="READING">Reading (Đọc hiểu)</option>
                    <option value="LISTENING">Listening (Nghe hiểu)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chế độ đề
                  </label>
                  <select
                    value={newTestMode}
                    onChange={(e) => setNewTestMode(e.target.value as TestMode)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold"
                  >
                    <option value="SINGLE_PASSAGE">Bài lẻ (Passage/Part)</option>
                    <option value="FULL_TEST">Full đề</option>
                    <option value="PLACEMENT">Đề Thi Xếp Lớp</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Passage / Part số
                  </label>
                  <select
                    value={newTestPassageNum}
                    onChange={(e) => setNewTestPassageNum(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold"
                  >
                    <option value={1}>Passage / Part 1</option>
                    <option value={2}>Passage / Part 2</option>
                    <option value={3}>Passage / Part 3</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nguồn tài liệu
                  </label>
                  <select
                    value={newTestSource}
                    onChange={(e) =>
                      setNewTestSource(e.target.value as TestSource)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold"
                  >
                    <option value="COLLECT_REAL">BluePass Collect đề thi</option>
                    <option value="CAMBRIDGE_C10_C20">Cambridge C10-C20</option>
                    <option value="SIMULATION">BluePass Simulation</option>
                    <option value="ACTUAL_TESTS">Actual Tests</option>
                    <option value="PRO_PACKAGE">Gói Luyện đề PRO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Thời gian làm bài (Phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={newTestDuration}
                    onChange={(e) => setNewTestDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Link ảnh bìa (Thumbnail URL)
                  </label>
                  <input
                    type="text"
                    value={newTestThumbnail}
                    onChange={(e) => setNewTestThumbnail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 font-bold text-[#1d4ed8]">
                    <input
                      type="checkbox"
                      checked={newTestIsPlacement}
                      onChange={(e) => setNewTestIsPlacement(e.target.checked)}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    <span>
                      Đặt làm Đề Thi Xếp Lớp Chính Thức (Bật giám sát chuyển tab)
                    </span>
                  </label>
                </div>
              </div>

              {/* Plain Text Passage Input */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung Bài Đọc (Chỉ cần copy-paste văn bản bình thường từ Word/PDF, xuống dòng để tách đoạn A, B, C — KHÔNG cần viết code HTML) *
                </label>
                <textarea
                  rows={5}
                  value={newTestPlainText}
                  onChange={(e) => setNewTestPlainText(e.target.value)}
                  placeholder="Dán các đoạn văn tiếng Anh từ file Word hoặc PDF vào đây..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs leading-relaxed text-slate-800"
                />
              </div>

              {/* Objective Questions Builder */}
              <div className="space-y-3 pt-2 border-t border-sky-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-extrabold text-[#1d4ed8]">
                      Loại câu hỏi:
                    </label>
                    <select
                      value={newTestQType}
                      onChange={(e) =>
                        setNewTestQType(e.target.value as QuestionType)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#0284c7]"
                    >
                      <option value="GAP_FILL">
                        Gap Filling (Điền từ - Hỗ trợ nhiều đáp án cách nhau bởi |)
                      </option>
                      <option value="TFNG">True - False - Not Given</option>
                      <option value="YNNG">Yes - No - Not Given</option>
                      <option value="SINGLE_CHOICE">
                        Multiple Choice (One Answer A/B/C/D)
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNewTestQuestions((prev) => [
                        ...prev,
                        {
                          prompt: `Question ${prev.length + 1}: Nhập nội dung câu hỏi...`,
                          correctAnswer:
                            newTestQType === "TFNG" ? "TRUE" : "keyword",
                          explanation: "Giải thích vị trí thông tin trong bài.",
                          optionsText:
                            "Lựa chọn A|Lựa chọn B|Lựa chọn C|Lựa chọn D",
                        },
                      ])
                    }
                    className="flex items-center gap-1 rounded-lg bg-[#0284c7] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm câu hỏi
                  </button>
                </div>

                {newTestQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs items-center"
                  >
                    <div className="md:col-span-5">
                      <label className="text-[10px] font-bold text-slate-400">
                        Nội dung Câu hỏi #{idx + 1} (Dùng ________ cho chỗ trống)
                      </label>
                      <input
                        type="text"
                        value={q.prompt}
                        onChange={(e) => {
                          const next = [...newTestQuestions];
                          next[idx].prompt = e.target.value;
                          setNewTestQuestions(next);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold"
                      />
                      {newTestQType === "SINGLE_CHOICE" && (
                        <input
                          type="text"
                          value={
                            q.optionsText ||
                            "Option A|Option B|Option C|Option D"
                          }
                          onChange={(e) => {
                            const next = [...newTestQuestions];
                            next[idx].optionsText = e.target.value;
                            setNewTestQuestions(next);
                          }}
                          placeholder="Các lựa chọn A|B|C|D cách nhau bởi dấu |"
                          className="mt-1.5 w-full rounded-lg border border-sky-200 bg-sky-50/40 px-2.5 py-1 text-[11px]"
                        />
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-bold text-emerald-700">
                        Đáp án đúng (Ẩn với học sinh khi thi)
                      </label>
                      <input
                        type="text"
                        value={q.correctAnswer}
                        onChange={(e) => {
                          const next = [...newTestQuestions];
                          next[idx].correctAnswer = e.target.value;
                          setNewTestQuestions(next);
                        }}
                        className="w-full rounded-lg border border-emerald-300 bg-emerald-50/40 px-2.5 py-1.5 font-mono font-bold text-emerald-900"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400">
                        Giải thích (Chỉ mở khóa sau khi nộp bài)
                      </label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => {
                          const next = [...newTestQuestions];
                          next[idx].explanation = e.target.value;
                          setNewTestQuestions(next);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5"
                      />
                    </div>
                    <div className="md:col-span-1 text-right pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setNewTestQuestions((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* LIVE SPLIT-SCREEN STUDENT PREVIEW */}
              {showLiveStudentPreview && (
                <div className="rounded-2xl border-2 border-sky-300 bg-white overflow-hidden shadow-sm">
                  <div className="bg-[#0284c7] px-4 py-2 text-xs font-extrabold text-white flex items-center justify-between">
                    <span>
                      👁️ XEM TRƯỚC GIAO DIỆN KHI HỌC SINH LÀM BÀI (SPLIT-SCREEN PREVIEW)
                    </span>
                    <span className="text-[11px] text-sky-100">
                      Đáp án & Giải thích đã được tự động ẩn đi giống hệt lúc thi thật
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 max-h-[340px] overflow-y-auto">
                    {/* Left Preview: Passage */}
                    <div
                      className="p-4 text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: generatedPreviewHtml,
                      }}
                    />
                    {/* Right Preview: Questions */}
                    <div className="p-4 space-y-3 bg-slate-50">
                      <h4 className="text-xs font-extrabold text-[#1d4ed8]">
                        Questions 1 – {newTestQuestions.length}
                      </h4>
                      {newTestQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-white p-3 space-y-2"
                        >
                          <p className="text-xs font-bold text-slate-800">
                            <span className="mr-2 inline-block rounded bg-[#0284c7] px-1.5 py-0.5 text-[10px] text-white">
                              {idx + 1}
                            </span>
                            {q.prompt}
                          </p>
                          {newTestQType === "GAP_FILL" ? (
                            <input
                              type="text"
                              disabled
                              placeholder="Ô học sinh nhập đáp án tiếng Anh..."
                              className="w-full max-w-xs rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs"
                            />
                          ) : (
                            <div className="text-[11px] text-slate-500">
                              • Các nút chọn đáp án trắc nghiệm ({newTestQType})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTestForm(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingTest}
                  className="rounded-xl bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-6 py-2 text-xs font-extrabold text-white shadow-md"
                >
                  {isSavingTest
                    ? "Đang lưu đề thi..."
                    : "Lưu & Xuất Bản Đề Thi Ngay"}
                </button>
              </div>
            </form>
          )}

          {/* Existing Tests Table with Delete & Preview Actions */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff6ff] text-[#1d4ed8] font-extrabold uppercase">
                <tr>
                  <th className="px-4 py-3">Tên Đề Thi</th>
                  <th className="px-3.5 py-3">Kỹ Năng</th>
                  <th className="px-3.5 py-3">Phân Loại</th>
                  <th className="px-3.5 py-3">Thời Gian / Số Câu</th>
                  <th className="px-3.5 py-3">Lượt Làm Bài</th>
                  <th className="px-4 py-3 text-right">Thao Tác Quản Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {allTestsList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{t.title}</p>
                      <p className="text-[11px] text-slate-400">
                        ID: <code className="font-mono">{t.id}</code> •{" "}
                        {t.questionTypesSummary.join(", ")}
                      </p>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-[#0284c7]">
                        {t.skill}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-slate-700">
                      {t.isPlacement
                        ? "Thi Xếp Lớp"
                        : t.mode === "FULL_TEST"
                        ? "Full đề"
                        : `Passage/Part ${t.passageNumber || 1}`}
                    </td>
                    <td className="px-3.5 py-3 text-slate-600">
                      {t.durationMinutes} phút • {t.totalQuestions} câu
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-700">
                      {t.attemptCount.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/exam/${t.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-[#eff6ff] px-2.5 py-1.5 text-[11px] font-bold text-[#0284c7] hover:bg-[#0284c7] hover:text-white transition"
                        >
                          <span>Mở đề</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        {currentUser.role === "ADMIN" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTest(t.id, t.title)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-600 hover:text-white transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xóa đề</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: MANUAL ANNOUNCEMENT & CLASS PLACEMENT PUBLISHER (UEH STYLE)  */}
      {/* =================================================================== */}
      {activeTab === "publish" && (
        <form
          onSubmit={handlePublishAnnouncement}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#1d4ed8]">
                TRÌNH SOẠN THẢO & ĐĂNG THÔNG BÁO XẾP LỚP THỦ CÔNG (UEH PORTAL)
              </h2>
              <p className="text-xs text-slate-500">
                Admin chủ động điều chỉnh danh sách phân lớp, lịch học hoặc danh sách loại sau khi xem xét điểm số
              </p>
            </div>

            <button
              type="button"
              onClick={handleImportRankingsToAnnouncement}
              className="flex items-center gap-1.5 rounded-xl bg-[#eff6ff] px-3.5 py-2 text-xs font-bold text-[#0284c7] border border-sky-200 hover:bg-sky-100"
            >
              <Sparkles className="h-4 w-4" />
              <span>Tự động nạp danh sách từ Bảng Xếp Hạng hiện tại</span>
            </button>
          </div>

          {publishSuccess && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {publishSuccess}
              </span>
              <Link
                href="/portal"
                className="rounded-lg bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700"
              >
                Xem trên Cổng Thông Báo →
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề Thông báo (Hiển thị trên bảng Thông báo chung) *
              </label>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:border-[#0284c7] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phân loại Thông báo
              </label>
              <select
                value={annCategory}
                onChange={(e) =>
                  setAnnCategory(e.target.value as AnnouncementCategory)
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm font-bold text-[#1d4ed8] bg-white focus:border-[#0284c7] focus:outline-none"
              >
                <option value="PLACEMENT_RESULT">
                  Công bố Danh sách Xếp lớp
                </option>
                <option value="CLASS_SCHEDULE">Lịch khai giảng & Phòng học</option>
                <option value="ELIMINATION_NOTICE">
                  Thông báo Học viên chưa đạt / Thi lại
                </option>
                <option value="EXAM_NOTICE">Quy chế Khảo thí</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đơn vị gửi (Cột &ldquo;Người gửi&rdquo;)
              </label>
              <input
                type="text"
                value={annSender}
                onChange={(e) => setAnnSender(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên tệp Excel/CSV đính kèm
              </label>
              <input
                type="text"
                value={annAttachmentName}
                onChange={(e) => setAnnAttachmentName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#1d4ed8]">
                <input
                  type="checkbox"
                  checked={annIsPinned}
                  onChange={(e) => setAnnIsPinned(e.target.checked)}
                  className="h-4 w-4 accent-[#0284c7]"
                />
                <span>Ghim thông báo này lên đầu bảng (Pinned)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nội dung chi tiết thông báo (Hỗ trợ HTML / Văn bản định dạng) *
            </label>
            <textarea
              rows={4}
              required
              value={annContentHtml}
              onChange={(e) => setAnnContentHtml(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3.5 text-xs font-medium text-slate-800 focus:border-[#0284c7] focus:outline-none"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1d4ed8]">
                Bảng Phân Lớp Học Viên Đính Kèm Trong Thông Báo ({placementRows.length} học viên)
              </h3>
              <button
                type="button"
                onClick={() =>
                  setPlacementRows((prev) => [
                    ...prev,
                    {
                      studentCode: `HV-2026-${Math.floor(1100 + Math.random() * 8000)}`,
                      fullName: "Học viên mới",
                      score: "8/10 (80%)",
                      band: "7.5",
                      assignedClass: "IELTS Fighter 6.5 (B2-02)",
                      schedule: "Thứ 3 - 5 - 7 (18:30)",
                      room: "P. B1-205",
                      status: "ĐẠT - XẾP LỚP",
                    },
                  ])
                }
                className="flex items-center gap-1 rounded-lg bg-[#0284c7] px-3 py-1.5 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm dòng học viên
              </button>
            </div>

            {placementRows.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">Mã HV</th>
                      <th className="p-2.5">Họ tên</th>
                      <th className="p-2.5">Điểm</th>
                      <th className="p-2.5">Lớp xếp chính thức</th>
                      <th className="p-2.5">Lịch học</th>
                      <th className="p-2.5">Trạng thái</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {placementRows.map((r, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.studentCode}
                            onChange={(e) => {
                              const next = [...placementRows];
                              next[idx].studentCode = e.target.value;
                              setPlacementRows(next);
                            }}
                            className="w-28 rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.fullName}
                            onChange={(e) => {
                              const next = [...placementRows];
                              next[idx].fullName = e.target.value;
                              setPlacementRows(next);
                            }}
                            className="w-40 rounded border border-slate-200 px-2 py-1 font-bold text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.score}
                            onChange={(e) => {
                              const next = [...placementRows];
                              next[idx].score = e.target.value;
                              setPlacementRows(next);
                            }}
                            className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.assignedClass}
                            onChange={(e) => {
                              const next = [...placementRows];
                              next[idx].assignedClass = e.target.value;
                              setPlacementRows(next);
                            }}
                            className="w-48 rounded border border-slate-200 px-2 py-1 font-semibold text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.schedule}
                            onChange={(e) => {
                              const next = [...placementRows];
                              next[idx].schedule = e.target.value;
                              setPlacementRows(next);
                            }}
                            className="w-40 rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={r.status}
                            onChange={(e) => {
                              const next = [...placementRows];
                              next[idx].status = e.target
                                .value as PlacementRow["status"];
                              setPlacementRows(next);
                            }}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-bold"
                          >
                            <option value="ĐẠT - XẾP LỚP">ĐẠT - XẾP LỚP</option>
                            <option value="CẦN HỌC BỔ TRỢ">CẦN HỌC BỔ TRỢ</option>
                            <option value="LOẠI / THI LẠI">LOẠI / THI LẠI</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setPlacementRows((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isPublishing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#1d4ed8] px-6 py-3 text-xs font-extrabold text-white shadow-md hover:opacity-95"
            >
              <Megaphone className="h-4 w-4" />
              <span>
                {isPublishing
                  ? "Đang phát hành thông báo..."
                  : "Đăng Chính Thức Lên Cổng Thông Báo Học Viên"}
              </span>
            </button>
          </div>

          {/* Existing Published Announcements List with Delete Action */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1d4ed8]">
              📋 Danh Sách Thông Báo Đang Hiển Thị Trên Cổng Học Viên ({publishedAnnouncements.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#eff6ff] text-[#1d4ed8] font-extrabold uppercase">
                  <tr>
                    <th className="px-3.5 py-2.5">Tiêu đề thông báo</th>
                    <th className="px-3.5 py-2.5">Phân loại</th>
                    <th className="px-3.5 py-2.5">Đơn vị gửi</th>
                    <th className="px-3.5 py-2.5">Ngày đăng</th>
                    <th className="px-3.5 py-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {publishedAnnouncements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">
                        {ann.isPinned && (
                          <span className="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
                            GHIM
                          </span>
                        )}
                        {ann.title}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-[#0284c7]">
                          {ann.category}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 font-semibold">
                        {ann.senderName}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500">
                        {new Date(ann.publishedAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteAnnouncement(ann.id, ann.title)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-600 hover:text-white transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Xóa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* TAB 4: STAFF LIVE CHAT INBOX (HYBRID AI-TO-HUMAN HANDOFF)           */}
      {/* =================================================================== */}
      {activeTab === "chat-inbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs min-h-[520px]">
          <div className="border-r border-slate-100 pr-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1d4ed8]">
              Danh Sách Hội Thoại Học Viên ({chatThreads.length})
            </h3>
            {chatThreads.map((t) => {
              const active = t.id === selectedChatThread?.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    active
                      ? "border-[#0284c7] bg-[#eff6ff]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      {t.studentName}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        t.status === "NEEDS_HUMAN"
                          ? "bg-red-500 text-white animate-pulse"
                          : t.status === "STAFF_ACTIVE"
                          ? "bg-amber-400 text-slate-900"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-[#0284c7]">
                    Mã HV: {t.studentCode || "Khách"} • {t.subject}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {t.messages[t.messages.length - 1]?.content}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedChatThread && (
            <div className="lg:col-span-2 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {selectedChatThread.studentName} (
                    {selectedChatThread.studentCode})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Trạng thái hiện tại:{" "}
                    <strong className="text-[#0284c7]">
                      {selectedChatThread.status}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedChatThread.status !== "STAFF_ACTIVE" && (
                    <button
                      onClick={() => handleStaffTakeover(selectedChatThread.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-900 shadow-xs hover:bg-amber-300"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Tiếp nhận tư vấn trực tiếp (Take Over)</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="my-4 flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4 max-h-[340px]">
                {selectedChatThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.senderRole === "STAFF" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="mb-1 text-[10px] font-bold text-slate-400">
                      {m.senderName} ({m.senderRole})
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                        m.senderRole === "STAFF"
                          ? "bg-[#0284c7] text-white"
                          : m.senderRole === "STUDENT"
                          ? "border border-amber-300 bg-amber-50 text-slate-900 font-medium"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendStaffReply}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={staffReplyInput}
                  onChange={(e) => setStaffReplyInput(e.target.value)}
                  placeholder="Nhập phản hồi của Tư vấn viên gửi trực tiếp tới cửa sổ chat của Học viên..."
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-medium focus:border-[#0284c7] focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#0284c7] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#1d4ed8]"
                >
                  <Send className="h-4 w-4" />
                  <span>Gửi phản hồi</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: RBAC USER MANAGEMENT & POSTGRESQL 18 / PGADMIN 4 DATABASE    */}
      {/* =================================================================== */}
      {activeTab === "vps-db" && (
        <div className="space-y-6">
          {/* RBAC User & Permission Management Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#1d4ed8]">
                  🛡️ QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN HỆ THỐNG (RBAC: ADMIN • STAFF • STUDENT)
                </h2>
                <p className="text-xs text-slate-500">
                  Mọi tài khoản đăng ký mới qua Gmail OTP hoặc Google OAuth 2.0 đều mặc định là STUDENT. Chỉ ADMIN mới có quyền nâng/hạ cấp độ phân quyền tại đây!
                </p>
              </div>
              <span className="rounded-xl bg-[#eff6ff] px-3.5 py-2 text-xs font-extrabold text-[#0284c7] border border-sky-200">
                Tổng số tài khoản: {adminUsers.length}
              </span>
            </div>

            {userRbacNotice && (
              <div className="rounded-xl border border-sky-200 bg-[#eff6ff] px-4 py-3 text-xs font-bold text-[#1d4ed8]">
                {userRbacNotice}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#eff6ff] text-[#1d4ed8] font-extrabold uppercase">
                  <tr>
                    <th className="px-3.5 py-3">Mã Định Danh</th>
                    <th className="px-3.5 py-3">Họ và Tên</th>
                    <th className="px-3.5 py-3">Email Tài Khoản</th>
                    <th className="px-3.5 py-3">Số Lượt Thi</th>
                    <th className="px-3.5 py-3">Vai Trò Hiện Tại (Role)</th>
                    <th className="px-3.5 py-3 text-right">
                      Đổi Phân Quyền / Xóa (Chỉ ADMIN)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {adminUsers.map((u) => {
                    const isRootAdmin =
                      u.email.toLowerCase() === "admin@bluepass.edu.vn";
                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-3.5 py-3 font-mono font-bold text-[#0284c7]">
                          {u.studentCode}
                        </td>
                        <td className="px-3.5 py-3 font-bold text-slate-900">
                          {u.fullName}
                        </td>
                        <td className="px-3.5 py-3 text-slate-600">{u.email}</td>
                        <td className="px-3.5 py-3 font-bold text-slate-700">
                          {u.attemptCount ?? 0} bài
                        </td>
                        <td className="px-3.5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                              u.role === "ADMIN"
                                ? "bg-amber-400 text-slate-950"
                                : u.role === "STAFF"
                                ? "bg-emerald-600 text-white"
                                : "bg-sky-100 text-[#0284c7]"
                            }`}
                          >
                            {u.role === "ADMIN"
                              ? "👑 ADMIN (Quản trị)"
                              : u.role === "STAFF"
                              ? "🎧 STAFF (Tư vấn)"
                              : "🎓 STUDENT (Học viên)"}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          {currentUser.role === "ADMIN" ? (
                            <div className="inline-flex items-center gap-2">
                              <select
                                disabled={isRootAdmin}
                                value={u.role}
                                onChange={(e) =>
                                  handleUpdateUserRole(
                                    u.id,
                                    e.target.value as Role
                                  )
                                }
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 disabled:opacity-50"
                              >
                                <option value="STUDENT">STUDENT (Học viên)</option>
                                <option value="STAFF">STAFF (Tư vấn viên)</option>
                                <option value="ADMIN">ADMIN (Quản trị viên)</option>
                              </select>
                              {!isRootAdmin && u.id !== "user-student-1" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteUser(u.id, u.fullName)
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-600 hover:text-white transition"
                                  title="Xóa tài khoản này"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">
                              Chỉ ADMIN được sửa
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PostgreSQL 18 + pgAdmin 4 + GitHub Sync Info Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff6ff] text-[#0284c7]">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#1d4ed8]">
                  CƠ SỞ DỮ LIỆU ĐỒNG BỘ TỨC THÌ (POSTGRESQL 18 + PGADMIN 4 + GITHUB)
                </h2>
                <p className="text-xs text-slate-500">
                  Mọi thao tác thêm/xóa đề, nộp bài, đăng ký tài khoản hoặc đổi phân quyền đều tự động đồng bộ xuống PostgreSQL 18 trong 0.5 giây!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-sky-200 bg-[#eff6ff] p-4 space-y-1.5">
                <span className="rounded bg-[#0284c7] px-2 py-0.5 text-[10px] font-bold text-white">
                  1. TRỰC TIẾP TRÊN WEB (/ADMIN)
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Trung Tâm Quản Trị & Phân Quyền
                </h3>
                <p className="text-slate-600">
                  Đăng tải/xóa đề thi ở Tab 2, xuất bảng điểm Excel ở Tab 1, đăng/xóa thông báo ở Tab 3, phân quyền ở Tab 5. Lưu trữ bền vững tại{" "}
                  <code className="font-mono font-bold">.data-cache.json</code>.
                </p>
              </div>

              <div className="rounded-xl border border-sky-200 bg-[#eff6ff] p-4 space-y-1.5">
                <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  2. PGADMIN 4 DESKTOP & POSTGRESQL 18
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Đồng bộ 12 Bảng Dữ Liệu Thật
                </h3>
                <p className="text-slate-600">
                  Server: <code className="font-mono font-bold">localhost:5432</code> • Database:{" "}
                  <code className="font-mono font-bold">bluepass_exam_db</code> &{" "}
                  <code className="font-mono font-bold">postgres</code> (User{" "}
                  <code className="font-mono font-bold">postgres</code> / Mật khẩu:{" "}
                  <code className="font-mono font-bold">123456</code>).
                </p>
              </div>

              <div className="rounded-xl border border-sky-200 bg-[#eff6ff] p-4 space-y-1.5">
                <span className="rounded bg-[#1d4ed8] px-2 py-0.5 text-[10px] font-bold text-white">
                  3. TÊN MIỀN PUBLIC & GITHUB REPO
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Truy Cập Mọi Thiết Bị & Lưu Trữ Code
                </h3>
                <p className="text-slate-600">
                  Link Web: <code className="font-mono font-bold">https://bluepass-ielts.serveousercontent.com</code> • GitHub:{" "}
                  <code className="font-mono font-bold">nguyentanhao125-blip/bluepass-ielts-platform</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: 2-WAY TELEGRAM BOT MONITORING & REMOTE CONTROL               */}
      {/* =================================================================== */}
      {activeTab === "telegram" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#1d4ed8]">
                  🤖 KẾT NỐI TELEGRAM 2 CHIỀU: THEO DÕI ĐIỂM & NHẮN TIN CẬP NHẬT TRANG WEB
                </h2>
                <p className="text-xs text-slate-600">
                  Nhận thông báo tự động khi học sinh nộp bài / đăng ký tài khoản và nhắn tin trực tiếp trên Telegram để thêm đề, xóa đề, đăng thông báo hoặc trả lời tư vấn!
                </p>
              </div>
              {tgBotUsername && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-800">
                  ✅ Đang kết nối Bot: @{tgBotUsername} {tgChatId ? `(Chat ID: ${tgChatId})` : ""}
                </div>
              )}
            </div>

            {tgNotice && (
              <div className="rounded-xl border border-sky-200 bg-[#eff6ff] p-3.5 text-xs font-bold text-[#1e3a8a]">
                {tgNotice}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Config Form */}
              <form
                onSubmit={handleSaveTelegramConfig}
                className="lg:col-span-6 space-y-4 rounded-2xl border border-sky-200 bg-[#f8fafc] p-5"
              >
                <div className="rounded-xl bg-[#eff6ff] p-3.5 text-xs text-slate-700 space-y-1">
                  <div className="font-extrabold text-[#1d4ed8]">
                    📌 Hướng dẫn lấy mã Bot Token trong 30 giây:
                  </div>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>
                      Mở ứng dụng <strong>Telegram</strong>, tìm tài khoản có tích xanh{" "}
                      <code className="font-mono font-bold text-[#0284c7]">@BotFather</code>.
                    </li>
                    <li>
                      Gõ lệnh <code className="font-mono font-bold">/newbot</code> ➔ đặt tên cho Bot của bạn (ví dụ: <em>BluePass Admin Bot</em> và username kết thúc bằng chữ <em>bot</em>).
                    </li>
                    <li>
                      Copy đoạn mã <strong>HTTP API Token</strong> (dạng <code className="font-mono">7123456789:AAH...</code>) dán vào ô bên dưới rồi nhấn <strong>Lưu & Kết Nối</strong>.
                    </li>
                    <li>
                      Mở Bot vừa tạo trên Telegram, bấm nút <strong>START</strong> (hoặc gõ <code className="font-mono font-bold">/start</code>) — hệ thống sẽ tự động bắt Chat ID của bạn ngay lập tức!
                    </li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Telegram Bot Token (từ @BotFather) *
                  </label>
                  <input
                    type="text"
                    required
                    value={tgBotToken}
                    onChange={(e) => setTgBotToken(e.target.value)}
                    placeholder="Ví dụ: 7482910384:AAH8x9kL2mP..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Admin Chat ID (Tự động điền khi bạn nhắn /start vào Bot)
                  </label>
                  <input
                    type="text"
                    value={tgChatId}
                    onChange={(e) => setTgChatId(e.target.value)}
                    placeholder="Để trống rồi nhắn /start vào Bot, hệ thống sẽ tự nhận diện!"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono"
                  />
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="font-bold text-slate-700">
                    3. Tự động gửi thông báo về Telegram khi:
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={tgNotifySubmit}
                      onChange={(e) => setTgNotifySubmit(e.target.checked)}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    <span>Học sinh vừa nộp bài thi (Báo điểm, Band, thời gian & số lần chuyển tab)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={tgNotifyRegister}
                      onChange={(e) => setTgNotifyRegister(e.target.checked)}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    <span>Học viên mới đăng ký tài khoản thành công</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={tgNotifyChat}
                      onChange={(e) => setTgNotifyChat(e.target.checked)}
                      className="h-4 w-4 accent-[#0284c7]"
                    />
                    <span>Học viên nhắn tin tư vấn trên web (Cho phép gõ /reply trả lời ngay trên Telegram)</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={tgLoading}
                    className="rounded-xl bg-[#0284c7] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-50"
                  >
                    {tgLoading ? "Đang kết nối..." : "💾 Lưu & Kích Hoạt Bot Telegram"}
                  </button>
                  <button
                    type="button"
                    disabled={tgLoading}
                    onClick={handleTestTelegramMessage}
                    className="rounded-xl border border-[#0284c7] bg-white px-4 py-2.5 text-xs font-extrabold text-[#0284c7] hover:bg-[#eff6ff] disabled:opacity-50"
                  >
                    🔔 Gửi Tin Nhắn Test Thử
                  </button>
                </div>
              </form>

              {/* Right Column: Command Cheat-Sheet & Activity Log */}
              <div className="lg:col-span-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    ⚡ BẢNG LỆNH NHẮN TIN TRÊN TELEGRAM ĐỂ CẬP NHẬT WEBSITE
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="rounded-lg bg-slate-800 p-2.5">
                      <span className="text-sky-400 font-bold">/stats</span> hoặc{" "}
                      <span className="text-sky-400 font-bold">/diem</span> hoặc{" "}
                      <span className="text-sky-400 font-bold">/dethi</span>
                      <div className="text-[11px] font-sans text-slate-300 mt-0.5">
                        Xem thống kê toàn hệ thống, Top 10 bảng điểm học sinh & danh sách mã ID đề thi.
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-800 p-2.5">
                      <span className="text-emerald-400 font-bold">
                        /thongbao Tiêu đề | Nội dung thông báo
                      </span>
                      <div className="text-[11px] font-sans text-slate-300 mt-0.5">
                        Đăng thông báo mới từ Telegram thẳng lên trang Cổng Thông Tin Học Viên (/portal) & cập nhật pgAdmin 4!
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-800 p-2.5">
                      <span className="text-amber-300 font-bold">
                        /themde Tên đề | READING | 20 | Đoạn văn | Câu 1 = Đáp án 1
                      </span>
                      <div className="text-[11px] font-sans text-slate-300 mt-0.5">
                        Tạo và xuất bản ngay 1 đề thi mới lên trang chủ từ tin nhắn Telegram!
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-800 p-2.5">
                      <span className="text-rose-400 font-bold">/xoade mã_id_đề</span>{" "}
                      &nbsp;|&nbsp;{" "}
                      <span className="text-purple-300 font-bold">/reply Nội dung trả lời</span>
                      <div className="text-[11px] font-sans text-slate-300 mt-0.5">
                        Xóa đề thi từ xa hoặc trả lời tin nhắn tư vấn của học viên trên web ngay từ điện thoại!
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="text-xs font-extrabold text-slate-800">
                    📡 Nhật ký tín hiệu Telegram gần nhất ({tgLogs.length})
                  </div>
                  {tgLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Chưa có tin nhắn nào. Hãy nhập Bot Token và nhắn /start vào Bot trên Telegram!
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 text-[11px]">
                      {tgLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5"
                        >
                          <span
                            className={`font-bold ${
                              log.direction === "INCOMING"
                                ? "text-emerald-700"
                                : "text-[#0284c7]"
                            }`}
                          >
                            [{log.direction === "INCOMING" ? "NHẬN TỪ TELEGRAM" : "GỬI TỚI TELEGRAM"}]
                          </span>{" "}
                          <span className="text-slate-700">{log.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm font-semibold text-slate-500">
          Đang tải Trung tâm Quản trị...
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
