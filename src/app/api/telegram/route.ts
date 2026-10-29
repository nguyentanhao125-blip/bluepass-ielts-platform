import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import {
  getTelegramState,
  handleIncomingTelegramMessage,
  saveTelegramState,
  sendTelegramMessage,
  verifyTelegramBotToken,
} from "@/lib/telegram";

export async function GET(req: NextRequest) {
  const caller = getAuthenticatedUser(req);
  if (!caller || (caller.role !== "ADMIN" && caller.role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const state = getTelegramState();
  const maskedToken = state.botToken
    ? `${state.botToken.slice(0, 10)}...${state.botToken.slice(-5)}`
    : "";

  return NextResponse.json({
    configured: Boolean(state.botToken),
    maskedToken,
    botToken: state.botToken,
    adminChatId: state.adminChatId,
    botUsername: state.botUsername,
    botFirstName: state.botFirstName,
    enabled: state.enabled,
    notifyOnSubmit: state.notifyOnSubmit,
    notifyOnRegister: state.notifyOnRegister,
    notifyOnChat: state.notifyOnChat,
    logs: state.logs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Case 1: Incoming Telegram Webhook Update
    if (body && typeof body.update_id === "number" && (body.message || body.edited_message)) {
      const msg = body.message || body.edited_message;
      if (msg?.text && msg?.chat?.id) {
        const senderName =
          [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") ||
          msg.from?.username ||
          "Admin";
        await handleIncomingTelegramMessage(String(msg.chat.id), String(msg.text), senderName);
      }
      return NextResponse.json({ ok: true });
    }

    // Case 2: Admin Dashboard Configuration or Test Message
    const caller = getAuthenticatedUser(req);
    if (!caller || caller.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Chỉ tài khoản ADMIN mới được phép cấu hình Telegram Bot." },
        { status: 403 }
      );
    }

    const state = getTelegramState();

    if (body.action === "save") {
      const newToken = (body.botToken ?? state.botToken ?? "").trim();
      let newChatId = (body.adminChatId ?? state.adminChatId ?? "").trim();

      if (!newToken) {
        return NextResponse.json(
          { error: "Vui lòng nhập Telegram Bot Token (lấy từ @BotFather)." },
          { status: 400 }
        );
      }

      const verify = await verifyTelegramBotToken(newToken);
      if (!verify.ok) {
        return NextResponse.json(
          { error: `Bot Token không hợp lệ: ${verify.error}` },
          { status: 400 }
        );
      }

      // If Admin hasn't entered Chat ID yet, check getUpdates to auto-detect from their /start message
      if (!newChatId) {
        try {
          const updRes = await fetch(
            `https://api.telegram.org/bot${newToken}/getUpdates?limit=10`,
            { cache: "no-store" }
          );
          const updData = await updRes.json();
          if (updData.ok && Array.isArray(updData.result) && updData.result.length > 0) {
            const lastMsg =
              updData.result[updData.result.length - 1].message ||
              updData.result[updData.result.length - 1].edited_message;
            if (lastMsg?.chat?.id) {
              newChatId = String(lastMsg.chat.id);
            }
          }
        } catch {
          // Ignore auto-detect failure
        }
      }

      state.botToken = newToken;
      state.adminChatId = newChatId;
      state.botUsername = verify.username || "";
      state.botFirstName = verify.firstName || "";
      state.enabled = body.enabled ?? true;
      state.notifyOnSubmit = body.notifyOnSubmit ?? true;
      state.notifyOnRegister = body.notifyOnRegister ?? true;
      state.notifyOnChat = body.notifyOnChat ?? true;
      saveTelegramState(state);

      if (newChatId) {
        await sendTelegramMessage(
          `✅ <b>Kết nối BluePass IELTS thành công!</b>\n` +
            `• <b>Bot:</b> @${state.botUsername}\n` +
            `• <b>Admin Chat ID:</b> <code>${newChatId}</code>\n` +
            `👉 Gõ /help để xem toàn bộ các lệnh theo dõi & cập nhật trang web ngay trên Telegram!`,
          newChatId
        );
      }

      return NextResponse.json({
        message: newChatId
          ? `Đã kết nối thành công với @${verify.username} (Chat ID: ${newChatId})!`
          : `Đã xác thực Bot @${verify.username}! Hãy mở Telegram nhắn "/start" vào @${verify.username} để hệ thống tự động nhận diện Chat ID của bạn.`,
        state: {
          configured: true,
          botToken: state.botToken,
          adminChatId: state.adminChatId,
          botUsername: state.botUsername,
          botFirstName: state.botFirstName,
          enabled: state.enabled,
          notifyOnSubmit: state.notifyOnSubmit,
          notifyOnRegister: state.notifyOnRegister,
          notifyOnChat: state.notifyOnChat,
          logs: state.logs,
        },
      });
    }

    if (body.action === "test") {
      if (!state.botToken) {
        return NextResponse.json(
          { error: "Bạn chưa lưu Telegram Bot Token." },
          { status: 400 }
        );
      }
      if (!state.adminChatId) {
        return NextResponse.json(
          {
            error: `Chưa có Chat ID! Hãy mở ứng dụng Telegram, tìm Bot @${
              state.botUsername || "của bạn"
            } và bấm "/start", hệ thống sẽ tự động bắt Chat ID trong 3 giây.`,
          },
          { status: 400 }
        );
      }

      const sendRes = await sendTelegramMessage(
        `🔔 <b>TIN NHẮN KIỂM TRA TỪ BLUEPASS IELTS</b>\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `✅ Hệ thống thông báo & điều khiển 2 chiều hoạt động hoàn hảo!\n` +
          `• Gõ /stats để xem báo cáo dữ liệu\n` +
          `• Gõ /diem để xem bảng điểm học viên\n` +
          `• Gõ /help để xem cách đăng thông báo & thêm/xóa đề thi từ Telegram.`
      );

      if (!sendRes.ok) {
        return NextResponse.json(
          { error: `Không gửi được tin nhắn: ${sendRes.error}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: "Đã gửi tin nhắn kiểm tra tới Telegram của bạn thành công!",
        logs: state.logs,
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}
