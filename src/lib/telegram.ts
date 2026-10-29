import fs from "fs";
import path from "path";
import { getStore, saveStoreToDisk } from "./store";
import { AnnouncementItem, TestItem } from "./types";

export interface TelegramConfigState {
  botToken: string;
  adminChatId: string;
  botUsername?: string;
  botFirstName?: string;
  enabled: boolean;
  notifyOnSubmit: boolean;
  notifyOnRegister: boolean;
  notifyOnChat: boolean;
  lastUpdateId: number;
  logs: {
    id: string;
    timestamp: string;
    direction: "INCOMING" | "OUTGOING";
    text: string;
  }[];
}

const TELEGRAM_CONFIG_PATH = path.join(process.cwd(), ".telegram-config.json");

const globalForTelegram = globalThis as unknown as {
  telegramState: TelegramConfigState | undefined;
  telegramPollingStarted: boolean | undefined;
};

function loadInitialTelegramState(): TelegramConfigState {
  try {
    if (fs.existsSync(TELEGRAM_CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(TELEGRAM_CONFIG_PATH, "utf-8"));
      return {
        botToken: parsed.botToken || process.env.TELEGRAM_BOT_TOKEN || "",
        adminChatId: parsed.adminChatId || process.env.TELEGRAM_CHAT_ID || "",
        botUsername: parsed.botUsername || "",
        botFirstName: parsed.botFirstName || "",
        enabled: parsed.enabled ?? Boolean(parsed.botToken || process.env.TELEGRAM_BOT_TOKEN),
        notifyOnSubmit: parsed.notifyOnSubmit ?? true,
        notifyOnRegister: parsed.notifyOnRegister ?? true,
        notifyOnChat: parsed.notifyOnChat ?? true,
        lastUpdateId: parsed.lastUpdateId || 0,
        logs: Array.isArray(parsed.logs) ? parsed.logs.slice(0, 30) : [],
      };
    }
  } catch {
    // Fallback to env defaults
  }

  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    adminChatId: process.env.TELEGRAM_CHAT_ID || "",
    botUsername: "",
    botFirstName: "",
    enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    notifyOnSubmit: true,
    notifyOnRegister: true,
    notifyOnChat: true,
    lastUpdateId: 0,
    logs: [],
  };
}

export function getTelegramState(): TelegramConfigState {
  if (!globalForTelegram.telegramState) {
    globalForTelegram.telegramState = loadInitialTelegramState();
  }
  if (!globalForTelegram.telegramPollingStarted) {
    globalForTelegram.telegramPollingStarted = true;
    startTelegramPollingLoop();
  }
  return globalForTelegram.telegramState;
}

export function saveTelegramState(state: TelegramConfigState) {
  globalForTelegram.telegramState = state;
  try {
    fs.writeFileSync(TELEGRAM_CONFIG_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // Ignore write errors in read-only environments
  }
}

function appendTelegramLog(direction: "INCOMING" | "OUTGOING", text: string) {
  const state = getTelegramState();
  state.logs.unshift({
    id: `tg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    direction,
    text: text.slice(0, 300),
  });
  if (state.logs.length > 30) {
    state.logs = state.logs.slice(0, 30);
  }
  saveTelegramState(state);
}

export async function verifyTelegramBotToken(token: string): Promise<{
  ok: boolean;
  username?: string;
  firstName?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/getMe`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();
    if (!data.ok || !data.result) {
      return { ok: false, error: data.description || "Token không hợp lệ" };
    }
    return {
      ok: true,
      username: data.result.username,
      firstName: data.result.first_name,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Không thể kết nối tới máy chủ Telegram",
    };
  }
}

export async function sendTelegramMessage(
  text: string,
  chatIdOverride?: string
): Promise<{ ok: boolean; error?: string }> {
  const state = getTelegramState();
  const token = state.botToken.trim();
  const targetChatId = (chatIdOverride || state.adminChatId || "").trim();

  if (!token || !targetChatId) {
    return {
      ok: false,
      error: "Chưa cấu hình Bot Token hoặc chưa có Chat ID nhận tin nhắn.",
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description || "Gửi tin nhắn thất bại" };
    }
    appendTelegramLog("OUTGOING", text.replace(/<[^>]+>/g, ""));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lỗi mạng khi gọi Telegram API",
    };
  }
}

/**
 * Process incoming 2-way Telegram commands from Admin to query & update the project live
 */
export async function handleIncomingTelegramMessage(
  chatId: string,
  rawText: string,
  senderName: string
) {
  const state = getTelegramState();
  const text = rawText.trim();
  appendTelegramLog("INCOMING", `[${senderName}]: ${text}`);

  // Auto-bind adminChatId if empty when the owner messages the bot first time
  if (!state.adminChatId) {
    state.adminChatId = String(chatId);
    saveTelegramState(state);
  }

  // Security: If adminChatId is already configured, only allow commands from that chatId
  if (state.adminChatId && String(chatId) !== String(state.adminChatId)) {
    await sendTelegramMessage(
      `⛔ <b>Truy cập bị từ chối!</b>\nBot này đã được khóa bảo mật cho Admin chính thức (Chat ID: <code>${state.adminChatId}</code>).`,
      chatId
    );
    return;
  }

  const store = getStore();
  const lower = text.toLowerCase();

  // 1. /start or /help
  if (lower === "/start" || lower === "/help" || lower === "help") {
    const reply =
      `🤖 <b>BLUEPASS IELTS - TRUNG TÂM ĐIỀU KHIỂN TELEGRAM 2 CHIỀU</b>\n` +
      `Xin chào Admin <b>${senderName}</b>! Chat ID của bạn (<code>${chatId}</code>) đã được liên kết thành công.\n\n` +
      `📊 <b>LỆNH THEO DÕI DỮ LIỆU TRỰC TIẾP:</b>\n` +
      `• /stats — Xem báo cáo tổng quan hệ thống\n` +
      `• /diem — Xem Top 10 bảng điểm học sinh mới nhất\n` +
      `• /dethi — Xem danh sách tất cả đề thi & mã ID\n` +
      `• /chat — Xem tin nhắn học viên đang cần tư vấn\n\n` +
      `⚡ <b>LỆNH NHẮN TIN ĐỂ CẬP NHẬT WEBSITE & DATABASE:</b>\n` +
      `• <b>Đăng thông báo mới lên web:</b>\n` +
      `  <code>/thongbao Tiêu đề | Nội dung thông báo</code>\n` +
      `• <b>Tạo nhanh đề thi mới từ Telegram:</b>\n` +
      `  <code>/themde Tên đề | READING | 20 | Nội dung bài đọc | Câu hỏi 1 = đáp án</code>\n` +
      `• <b>Xóa đề thi trên web:</b>\n` +
      `  <code>/xoade mã_id_đề</code>\n` +
      `• <b>Trả lời chat tư vấn cho học viên trên web:</b>\n` +
      `  <code>/reply Nội dung phản hồi học viên</code>`;
    await sendTelegramMessage(reply, chatId);
    return;
  }

  // 2. /stats or /baocao
  if (lower === "/stats" || lower === "/baocao") {
    const submitted = store.attempts.filter((a) => a.status === "SUBMITTED");
    const avgBand =
      submitted.length > 0
        ? (submitted.reduce((acc, a) => acc + a.bandScore, 0) / submitted.length).toFixed(1)
        : "0.0";
    const needsHuman = store.chatThreads.filter((t) => t.status === "NEEDS_HUMAN").length;

    const reply =
      `📈 <b>BÁO CÁO TRẠNG THÁI HỆ THỐNG BLUEPASS</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👥 <b>Tổng tài khoản:</b> ${store.users.length} người dùng\n` +
      `📚 <b>Tổng số đề thi:</b> ${store.tests.length} đề (${store.tests.filter((t) => t.isPlacement).length} đề xếp lớp)\n` +
      `📝 <b>Lượt nộp bài:</b> ${submitted.length} bài đã chấm\n` +
      `🎯 <b>Band trung bình:</b> ${avgBand}\n` +
      `📢 <b>Thông báo học vụ:</b> ${store.announcements.length} bản tin\n` +
      `💬 <b>Hội thoại chờ nhân viên:</b> ${needsHuman} cuộc hội thoại\n` +
      `🗄️ <b>Trạng thái PostgreSQL (pgAdmin 4):</b> Đang đồng bộ Real-time`;
    await sendTelegramMessage(reply, chatId);
    return;
  }

  // 3. /diem or /rankings
  if (lower === "/diem" || lower === "/rankings") {
    const sorted = [...store.attempts]
      .filter((a) => a.status === "SUBMITTED")
      .sort((a, b) => {
        if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
        if (a.timeSpentSeconds !== b.timeSpentSeconds)
          return a.timeSpentSeconds - b.timeSpentSeconds;
        return a.tabSwitchCount - b.tabSwitchCount;
      })
      .slice(0, 10);

    if (sorted.length === 0) {
      await sendTelegramMessage("📭 Hiện chưa có lượt nộp bài nào.", chatId);
      return;
    }

    const lines = sorted.map((a, idx) => {
      const mins = Math.floor(a.timeSpentSeconds / 60);
      const secs = a.timeSpentSeconds % 60;
      const warn = a.tabSwitchCount >= 3 ? ` ⚠️(${a.tabSwitchCount} tab)` : "";
      return `${idx + 1}. <b>${a.userFullName}</b> (<code>${a.userStudentCode}</code>)\n   └ Điểm: <b>${a.rawScore}/${a.totalQuestions}</b> (Band ${a.bandScore}) | ⏱ ${mins}p${secs}s${warn}`;
    });

    await sendTelegramMessage(
      `🏆 <b>TOP 10 BẢNG XẾP HẠNG ĐIỂM HỌC VIÊN</b>\n━━━━━━━━━━━━━━━━━━\n` +
        lines.join("\n"),
      chatId
    );
    return;
  }

  // 4. /dethi or /tests
  if (lower === "/dethi" || lower === "/tests") {
    const lines = store.tests.map(
      (t, idx) =>
        `${idx + 1}. <b>${t.title}</b>\n   └ ID: <code>${t.id}</code> | ${t.skill} | ${t.durationMinutes}p | ${t.totalQuestions} câu`
    );
    await sendTelegramMessage(
      `📚 <b>DANH SÁCH ĐỀ THI TRÊN WEB (${store.tests.length} ĐỀ)</b>\n━━━━━━━━━━━━━━━━━━\n` +
        lines.join("\n") +
        `\n\n💡 <i>Gõ <code>/xoade mã_ID</code> để xóa đề bất kỳ.</i>`,
      chatId
    );
    return;
  }

  // 5. /thongbao Tiêu đề | Nội dung
  if (lower.startsWith("/thongbao ")) {
    const body = text.slice("/thongbao ".length).trim();
    const parts = body.split("|").map((s) => s.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      await sendTelegramMessage(
        `⚠️ <b>Sai cú pháp!</b> Vui lòng nhập theo mẫu:\n<code>/thongbao Tiêu đề thông báo | Nội dung chi tiết</code>`,
        chatId
      );
      return;
    }

    const [title, content] = parts;
    const newAnn: AnnouncementItem = {
      id: `ann-tg-${Date.now()}`,
      title,
      slug: `thong-bao-telegram-${Date.now()}`,
      category: "GENERAL",
      senderName: `${senderName} (via Telegram Bot)`,
      senderDepartment: "Ban Quản Trị BluePass",
      contentHtml: `<div class="space-y-2 text-slate-700 leading-relaxed"><p>${content}</p></div>`,
      isPinned: true,
      isPublished: true,
      isNew: true,
      publishedAt: new Date().toISOString(),
    };

    store.announcements.unshift(newAnn);
    saveStoreToDisk(store);

    await sendTelegramMessage(
      `✅ <b>ĐÃ ĐĂNG THÔNG BÁO LÊN WEB & CẬP NHẬT PGADMIN 4!</b>\n` +
        `📌 <b>Tiêu đề:</b> ${title}\n` +
        `📝 <b>Nội dung:</b> ${content}\n` +
        `🌐 Học sinh đã có thể xem ngay tại mục <b>Thông báo chung (/portal)</b>!`,
      chatId
    );
    return;
  }

  // 6. /xoade <testId>
  if (lower.startsWith("/xoade ")) {
    const targetId = text.slice("/xoade ".length).trim();
    const idx = store.tests.findIndex(
      (t) => t.id.toLowerCase() === targetId.toLowerCase() || t.slug.toLowerCase() === targetId.toLowerCase()
    );
    if (idx === -1) {
      await sendTelegramMessage(
        `❌ Không tìm thấy đề thi có ID: <code>${targetId}</code>.\nGõ /dethi để xem danh sách mã ID đề thi.`,
        chatId
      );
      return;
    }

    const removed = store.tests[idx];
    store.tests.splice(idx, 1);
    saveStoreToDisk(store);

    await sendTelegramMessage(
      `🗑️ <b>ĐÃ XÓA ĐỀ THI THÀNH CÔNG TRÊN WEB & PGADMIN 4!</b>\n` +
        `• Đề đã xóa: <b>${removed.title}</b> (<code>${removed.id}</code>)\n` +
        `• Tổng số đề còn lại: <b>${store.tests.length} đề</b>`,
      chatId
    );
    return;
  }

  // 7. /themde Tên đề | READING | 20 | Đoạn văn | Câu hỏi = Đáp án
  if (lower.startsWith("/themde ")) {
    const body = text.slice("/themde ".length).trim();
    const parts = body.split("|").map((s) => s.trim());
    if (parts.length < 5) {
      await sendTelegramMessage(
        `⚠️ <b>Cú pháp tạo đề nhanh qua Telegram:</b>\n` +
          `<code>/themde Tên đề thi | READING | 20 | Nội dung bài đọc | Câu hỏi 1 = Đáp án 1</code>`,
        chatId
      );
      return;
    }

    const [title, rawSkill, rawMinutes, passageText, ...questionPairs] = parts;
    const skill = rawSkill.toUpperCase() === "LISTENING" ? "LISTENING" : "READING";
    const durationMinutes = Math.max(5, parseInt(rawMinutes, 10) || 20);
    const testId = `test-tg-${Date.now()}`;
    const partId = `part-tg-${Date.now()}`;
    const groupId = `qg-tg-${Date.now()}`;

    const questions = questionPairs.map((pair, idx) => {
      const [qPrompt, qAns] = pair.split("=").map((s) => s.trim());
      return {
        id: `q-tg-${Date.now()}-${idx + 1}`,
        groupId,
        questionNumber: idx + 1,
        prompt: qPrompt || `Question ${idx + 1}`,
        correctAnswer: qAns || "TRUE",
        explanation: "Được tạo trực tiếp qua Telegram Bot.",
        points: 1,
      };
    });

    const newTest: TestItem = {
      id: testId,
      slug: `de-telegram-${Date.now()}`,
      title,
      description: `Đề thi được Admin ${senderName} đăng trực tiếp qua Telegram Bot.`,
      skill,
      mode: "SINGLE_PASSAGE",
      passageNumber: 1,
      source: "COLLECT_REAL",
      durationMinutes,
      totalQuestions: questions.length,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
      attemptCount: 1,
      questionTypesSummary: ["Gap Filling"],
      isPlacement: false,
      isPublished: true,
      createdAt: new Date().toISOString(),
      parts: [
        {
          id: partId,
          testId,
          partNumber: 1,
          title: skill === "LISTENING" ? "LISTENING PART 1" : "READING PASSAGE 1",
          subtitle: title,
          passageHtml: `<div class="space-y-4 leading-relaxed text-slate-800"><p><strong>Paragraph A.</strong> ${passageText}</p></div>`,
          audioUrl: skill === "LISTENING" ? "/api/audio/myopia-lecture" : undefined,
          questionGroups: [
            {
              id: groupId,
              partId,
              orderIndex: 1,
              questionType: "GAP_FILL",
              title: `Questions 1 – ${questions.length}`,
              instructions: "Complete the sentences below.",
              wordLimitNote: "ONE WORD AND/OR A NUMBER",
              questions,
            },
          ],
        },
      ],
    };

    store.tests.unshift(newTest);
    saveStoreToDisk(store);

    await sendTelegramMessage(
      `🎉 <b>ĐÃ TẠO ĐỀ THI MỚI LÊN WEB & ĐỒNG BỘ PGADMIN 4!</b>\n` +
        `• <b>Tên đề:</b> ${newTest.title}\n` +
        `• <b>Mã ID:</b> <code>${newTest.id}</code>\n` +
        `• <b>Kỹ năng:</b> ${newTest.skill} (${newTest.durationMinutes} phút - ${questions.length} câu)`,
      chatId
    );
    return;
  }

  // 8. /chat & /reply
  if (lower === "/chat") {
    const threads = store.chatThreads.slice(0, 5);
    const lines = threads.map((t, i) => {
      const lastMsg = t.messages[t.messages.length - 1];
      return `${i + 1}. <b>${t.studentName}</b> [${t.status}]\n   └ "${lastMsg?.content.slice(0, 80) || ""}..."`;
    });
    await sendTelegramMessage(
      `💬 <b>HỘI THOẠI TƯ VẤN HỌC VIÊN</b>\n━━━━━━━━━━━━━━━━━━\n` +
        lines.join("\n") +
        `\n\n💡 <i>Gõ <code>/reply Nội dung trả lời</code> để phản hồi ngay cho học viên đang chờ!</i>`,
      chatId
    );
    return;
  }

  if (lower.startsWith("/reply ")) {
    const replyContent = text.slice("/reply ".length).trim();
    const targetThread =
      store.chatThreads.find((t) => t.status === "NEEDS_HUMAN" || t.unreadByStaff) ||
      store.chatThreads[0];

    if (!targetThread) {
      await sendTelegramMessage("📭 Không có hội thoại học viên nào để trả lời.", chatId);
      return;
    }

    targetThread.status = "STAFF_ACTIVE";
    targetThread.unreadByStaff = false;
    targetThread.unreadByStudent = true;
    targetThread.updatedAt = new Date().toISOString();
    targetThread.messages.push({
      id: `msg-tg-${Date.now()}`,
      threadId: targetThread.id,
      senderRole: "STAFF",
      senderName: `${senderName} (Tư vấn qua Telegram)`,
      content: replyContent,
      createdAt: new Date().toISOString(),
    });
    saveStoreToDisk(store);

    await sendTelegramMessage(
      `✅ <b>Đã gửi phản hồi tới học viên ${targetThread.studentName} ngay trên Web!</b>\n` +
        `💬 Nội dung: "${replyContent}"`,
      chatId
    );
    return;
  }

  // Default fallback
  await sendTelegramMessage(
    `🤖 Mình đã nhận tin nhắn của bạn: "<i>${text}</i>"\n` +
      `Gõ /help để xem danh sách các lệnh xem điểm (/diem), thống kê (/stats), đăng thông báo (/thongbao), thêm đề (/themde), xóa đề (/xoade) và trả lời học viên (/reply).`,
    chatId
  );
}

/**
 * Background Long-Polling Loop (Works on both Localhost & VPS without requiring HTTPS Webhook)
 */
function startTelegramPollingLoop() {
  setInterval(async () => {
    const state = getTelegramState();
    if (!state.enabled || !state.botToken.trim()) return;

    try {
      const offset = state.lastUpdateId ? state.lastUpdateId + 1 : 0;
      const url = `https://api.telegram.org/bot${state.botToken.trim()}/getUpdates?offset=${offset}&timeout=1`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.result)) return;

      for (const update of data.result) {
        if (update.update_id > state.lastUpdateId) {
          state.lastUpdateId = update.update_id;
          saveTelegramState(state);
        }

        const msg = update.message || update.edited_message;
        if (msg && msg.text && msg.chat?.id) {
          const senderName =
            [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") ||
            msg.from?.username ||
            "Admin";
          await handleIncomingTelegramMessage(String(msg.chat.id), String(msg.text), senderName);
        }
      }
    } catch {
      // Ignore transient network polling errors
    }
  }, 3500);
}

/**
 * Push Notification Helpers for Real-Time Website Events
 */
export async function notifyExamSubmissionToTelegram(payload: {
  studentName: string;
  studentCode: string;
  studentEmail: string;
  testTitle: string;
  rawScore: number;
  totalQuestions: number;
  bandScore: number;
  timeSpentSeconds: number;
  tabSwitchCount: number;
}) {
  const state = getTelegramState();
  if (!state.enabled || !state.notifyOnSubmit || !state.botToken || !state.adminChatId) return;

  const mins = Math.floor(payload.timeSpentSeconds / 60);
  const secs = payload.timeSpentSeconds % 60;
  const cheatAlert =
    payload.tabSwitchCount >= 3
      ? `\n⚠️ <b>CẢNH BÁO CHUYỂN TAB:</b> ${payload.tabSwitchCount} lần!`
      : `\n🛡️ <b>Chuyển tab:</b> ${payload.tabSwitchCount} lần (Hợp lệ)`;

  const msg =
    `🎯 <b>HỌC VIÊN VỪA NỘP BÀI THI MỚI!</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Học viên:</b> ${payload.studentName} (<code>${payload.studentCode}</code>)\n` +
    `📧 <b>Email:</b> ${payload.studentEmail}\n` +
    `📘 <b>Đề thi:</b> ${payload.testTitle}\n` +
    `🏆 <b>Điểm số:</b> <b>${payload.rawScore}/${payload.totalQuestions}</b> (Band <b>${payload.bandScore}</b>)\n` +
    `⏱ <b>Thời gian làm:</b> ${mins} phút ${secs} giây` +
    cheatAlert;

  await sendTelegramMessage(msg);
}

export async function notifyNewUserToTelegram(payload: {
  fullName: string;
  email: string;
  studentCode: string;
  phone: string;
  targetBand: number;
}) {
  const state = getTelegramState();
  if (!state.enabled || !state.notifyOnRegister || !state.botToken || !state.adminChatId) return;

  const msg =
    `🆕 <b>HỌC VIÊN MỚI ĐĂNG KÝ TÀI KHOẢN (ĐÃ XÁC THỰC OTP)</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Họ tên:</b> ${payload.fullName}\n` +
    `🆔 <b>Mã HV:</b> <code>${payload.studentCode}</code>\n` +
    `📧 <b>Gmail:</b> ${payload.email}\n` +
    `📞 <b>SĐT:</b> ${payload.phone}\n` +
    `🎯 <b>Mục tiêu:</b> IELTS ${payload.targetBand}`;

  await sendTelegramMessage(msg);
}

export async function notifySupportChatToTelegram(payload: {
  studentName: string;
  studentEmail: string;
  message: string;
  needsHuman: boolean;
}) {
  const state = getTelegramState();
  if (!state.enabled || !state.notifyOnChat || !state.botToken || !state.adminChatId) return;

  const header = payload.needsHuman
    ? `🚨 <b>HỌC VIÊN YÊU CẦU GẶP NHÂN VIÊN TƯ VẤN!</b>`
    : `💬 <b>TIN NHẮN MỚI TỪ HỌC VIÊN TRÊN WEB</b>`;

  const msg =
    `${header}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Học viên:</b> ${payload.studentName} (${payload.studentEmail})\n` +
    `📝 <b>Nội dung:</b> "${payload.message}"\n\n` +
    `👉 <i>Gõ <code>/reply Nội dung trả lời</code> ngay tại đây để nhắn trả lại lên web!</i>`;

  await sendTelegramMessage(msg);
}
