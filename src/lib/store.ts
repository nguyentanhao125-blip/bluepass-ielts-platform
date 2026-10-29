import fs from "fs";
import path from "path";
import { syncStateToPrismaClient } from "./pg-sync";
import { prisma } from "./prisma";
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ATTEMPTS,
  INITIAL_CHAT_THREADS,
  INITIAL_TESTS,
  INITIAL_USERS,
  INITIAL_VOCAB_DECKS,
} from "./seed-data";
import {
  AnnouncementItem,
  ChatThreadItem,
  TestAttemptItem,
  TestItem,
  UserProfile,
  VocabDeckItem,
} from "./types";

export interface PendingOtpRegistration {
  email: string;
  fullName: string;
  passwordHash: string;
  phone: string;
  targetBand: number;
  otpCode: string;
  expiresAt: number;
  clientIp: string;
}

interface PlatformState {
  users: UserProfile[];
  passwordHashes: Record<string, string>; // email -> hashed password
  pendingRegistrations: Record<string, PendingOtpRegistration>; // email -> pending OTP verification
  ipRegistrationLog: Record<string, number[]>; // ip -> timestamps of accounts created
  tests: TestItem[];
  attempts: TestAttemptItem[];
  submissionLocks: Set<string>; // Idempotent transaction locks for attemptId
  announcements: AnnouncementItem[];
  vocabDecks: VocabDeckItem[];
  vocabProgress: Record<string, "NEW" | "LEARNING" | "MASTERED">; // `${userId}:${wordId}`
  chatThreads: ChatThreadItem[];
}

const CACHE_FILE_PATH = path.join(process.cwd(), ".data-cache.json");

const globalForStore = globalThis as unknown as {
  bluepassStore: PlatformState | undefined;
};

function createInitialStore(): PlatformState {
  // Try loading persisted data from disk (.data-cache.json) first
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tests) && Array.isArray(parsed.attempts)) {
        return {
          users: parsed.users || structuredClone(INITIAL_USERS),
          passwordHashes: parsed.passwordHashes || {
            "hocvien@bluepass.edu.vn": "123456",
            "tuvan@bluepass.edu.vn": "123456",
            "admin@bluepass.edu.vn": "123456",
          },
          pendingRegistrations: {},
          ipRegistrationLog: {},
          tests: parsed.tests,
          attempts: parsed.attempts,
          submissionLocks: new Set<string>(),
          announcements: parsed.announcements || structuredClone(INITIAL_ANNOUNCEMENTS),
          vocabDecks: parsed.vocabDecks || structuredClone(INITIAL_VOCAB_DECKS),
          vocabProgress: parsed.vocabProgress || {},
          chatThreads: parsed.chatThreads || structuredClone(INITIAL_CHAT_THREADS),
        };
      }
    }
  } catch {
    // Fallback to seed data if cache file doesn't exist or is invalid
  }

  return {
    users: structuredClone(INITIAL_USERS),
    passwordHashes: {
      "hocvien@bluepass.edu.vn": "123456",
      "tuvan@bluepass.edu.vn": "123456",
      "admin@bluepass.edu.vn": "123456",
    },
    pendingRegistrations: {},
    ipRegistrationLog: {},
    tests: structuredClone(INITIAL_TESTS),
    attempts: structuredClone(INITIAL_ATTEMPTS),
    submissionLocks: new Set<string>(),
    announcements: structuredClone(INITIAL_ANNOUNCEMENTS),
    vocabDecks: structuredClone(INITIAL_VOCAB_DECKS),
    vocabProgress: {
      "user-student-1:vw-1": "MASTERED",
      "user-student-1:vw-2": "MASTERED",
      "user-student-1:vw-3": "LEARNING",
      "user-student-1:vw-9": "MASTERED",
    },
    chatThreads: structuredClone(INITIAL_CHAT_THREADS),
  };
}

let diskWriteTimeout: ReturnType<typeof setTimeout> | null = null;
let pgSyncTimeout: ReturnType<typeof setTimeout> | null = null;

export function saveStoreToDisk(store: PlatformState) {
  if (diskWriteTimeout) clearTimeout(diskWriteTimeout);
  diskWriteTimeout = setTimeout(() => {
    const serializable = {
      users: store.users,
      passwordHashes: store.passwordHashes,
      tests: store.tests,
      attempts: store.attempts,
      announcements: store.announcements,
      vocabDecks: store.vocabDecks,
      vocabProgress: store.vocabProgress,
      chatThreads: store.chatThreads,
    };
    fs.promises
      .writeFile(CACHE_FILE_PATH, JSON.stringify(serializable, null, 2), "utf-8")
      .catch(() => {});
  }, 300);

  // Debounced non-blocking background synchronization to PostgreSQL (pgAdmin 4)
  const dbClient = prisma;
  if (dbClient) {
    if (pgSyncTimeout) clearTimeout(pgSyncTimeout);
    pgSyncTimeout = setTimeout(() => {
      syncStateToPrismaClient(dbClient, store).catch((err) => {
        console.error("[pg-sync] Background sync error:", err);
      });
    }, 1500);
  }
}

export function getStore(): PlatformState {
  if (!globalForStore.bluepassStore) {
    globalForStore.bluepassStore = createInitialStore();
  }
  return globalForStore.bluepassStore;
}

/**
 * Built-in Knowledge Base AI Engine for BluePass Center
 */
export function generateAiKnowledgeBaseReply(userMessage: string): {
  reply: string;
  shouldEscalateToHuman: boolean;
} {
  const lower = userMessage.toLowerCase();

  if (
    lower.includes("nhân viên") ||
    lower.includes("tư vấn viên") ||
    lower.includes("gặp người") ||
    lower.includes("đổi lịch") ||
    lower.includes("đổi lớp") ||
    lower.includes("bảo lưu") ||
    lower.includes("hoàn phí") ||
    lower.includes("khiếu nại")
  ) {
    return {
      shouldEscalateToHuman: true,
      reply:
        "Mình đã ghi nhận yêu cầu hỗ trợ trực tiếp từ **Nhân viên Tư vấn / Phòng Đào Tạo**. Hệ thống đã chuyển trạng thái hội thoại sang **Cần Nhân Viên Tư Vấn (NEEDS_HUMAN)**. Chuyên viên tư vấn sẽ phản hồi bạn ngay tại cửa sổ chat này!",
    };
  }

  if (
    lower.includes("học phí") ||
    lower.includes("giá") ||
    lower.includes("khóa học") ||
    lower.includes("lộ trình")
  ) {
    return {
      shouldEscalateToHuman: false,
      reply:
        "**Bảng học phí & Lộ trình các khóa học tại BluePass 2026:**\n" +
        "• **IELTS Foundation (4.0 - 5.0):** 4.200.000đ / khóa (8 tuần - 24 buổi)\n" +
        "• **IELTS Pre-Intermediate (5.0 - 6.0):** 5.500.000đ / khóa (10 tuần - 30 buổi)\n" +
        "• **IELTS Fighter (6.0 - 6.5+):** 6.800.000đ / khóa (10 tuần - 30 buổi)\n" +
        "• **IELTS Intensive PRO (7.0 - 8.0+):** 8.500.000đ / khóa (Cam kết đầu ra bằng văn bản)\n" +
        "👉 *Đặc biệt: Học viên hoàn thành bài **Thi Xếp Lớp Đầu Vào** đạt từ 80% trở lên được học bổng giảm ngay 15% học phí!*",
    };
  }

  if (
    lower.includes("xếp lớp") ||
    lower.includes("thi thử") ||
    lower.includes("placement") ||
    lower.includes("kết quả")
  ) {
    return {
      shouldEscalateToHuman: false,
      reply:
        "**Hướng dẫn Thi Xếp Lớp & Xem Kết Quả:**\n" +
        "1. Vào mục **Thi Xếp Lớp** trên thanh menu màu xanh hoặc chọn đề `[Placement Test 2026]`.\n" +
        "2. Thời gian làm bài là **25 phút** (đồng hồ khóa trên máy chủ, lưu nháp tự động mỗi 10 giây).\n" +
        "3. Lưu ý không chuyển tab quá 3 lần trong lúc thi.\n" +
        "4. Sau khi Ban Khảo Thí xét duyệt điểm từ cao xuống thấp, danh sách phân lớp chính thức sẽ được đăng tại mục **Thông báo (Cổng Thông Tin Học Viên)**.",
    };
  }

  if (
    lower.includes("từ vựng") ||
    lower.includes("flashcard") ||
    lower.includes("dictation") ||
    lower.includes("chép chính tả")
  ) {
    return {
      shouldEscalateToHuman: false,
      reply:
        "Bạn có thể vào mục **Sổ Từ Vựng** trên thanh điều hướng để ôn luyện từ vựng trích xuất từ các bài Reading & Listening theo 3 chế độ:\n" +
        "• **Flashcard 3D:** Lật thẻ kèm phát âm chuẩn Anh-Mỹ\n" +
        "• **Trắc nghiệm 4 đáp án:** Kiểm tra phản xạ nghĩa tiếng Việt\n" +
        "• **Nghe - Chép chính tả (Dictation):** Nghe audio và gõ lại chính xác từ vựng.",
    };
  }

  return {
    shouldEscalateToHuman: false,
    reply:
      "Cảm ơn bạn đã nhắn tin cho **BluePass English Center**! Mình có thể giải đáp ngay về:\n" +
      "• **Học phí & Lịch khai giảng** các lớp A2, B1, B2, C1 Intensive\n" +
      "• **Quy chế Thi Xếp Lớp** & Tra cứu danh sách phân lớp\n" +
      "• **Cách luyện đề Reading / Listening** và Sổ Từ Vựng\n\n" +
      "Nếu bạn muốn trò chuyện trực tiếp với chuyên viên Phòng Đào Tạo, hãy nhấn nút **\"Gặp nhân viên tư vấn\"** bên dưới nhé!",
  };
}
