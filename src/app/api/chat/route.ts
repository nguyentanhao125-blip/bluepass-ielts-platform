import { NextRequest, NextResponse } from "next/server";
import { generateAiKnowledgeBaseReply, getStore, saveStoreToDisk } from "@/lib/store";
import { notifySupportChatToTelegram } from "@/lib/telegram";
import { ChatMessageItem, ChatStatus, SenderRole } from "@/lib/types";

export async function GET(req: NextRequest) {
  const store = getStore();
  const threadId = req.nextUrl.searchParams.get("threadId");
  const mode = req.nextUrl.searchParams.get("mode"); // "staff" returns all threads

  if (mode === "staff") {
    const sorted = [...store.chatThreads].sort((a, b) => {
      // Prioritize NEEDS_HUMAN at the very top of Staff Inbox
      if (a.status === "NEEDS_HUMAN" && b.status !== "NEEDS_HUMAN") return -1;
      if (b.status === "NEEDS_HUMAN" && a.status !== "NEEDS_HUMAN") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json({
      threads: sorted,
      needsHumanCount: sorted.filter((t) => t.status === "NEEDS_HUMAN").length,
    });
  }

  const thread =
    store.chatThreads.find((t) => t.id === threadId) || store.chatThreads[0];

  return NextResponse.json({
    thread,
  });
}

export async function POST(req: NextRequest) {
  try {
    const store = getStore();
    const body = await req.json();
    const {
      threadId = "thread-student-1",
      senderRole = "STUDENT",
      senderName,
      content,
      action,
      targetStatus,
    }: {
      threadId?: string;
      senderRole?: SenderRole;
      senderName?: string;
      content?: string;
      action?: "REQUEST_HUMAN" | "STAFF_TAKEOVER" | "RETURN_TO_AI";
      targetStatus?: ChatStatus;
    } = body;

    let thread = store.chatThreads.find((t) => t.id === threadId);
    if (!thread) {
      thread = store.chatThreads[0];
    }

    const nowIso = new Date().toISOString();

    // 1. Handle Explicit Status Transitions (Student clicking "Gặp nhân viên tư vấn" or Staff takeover)
    if (action === "REQUEST_HUMAN") {
      thread.status = "NEEDS_HUMAN";
      thread.unreadByStaff = true;
      thread.updatedAt = nowIso;

      const sysMsg: ChatMessageItem = {
        id: `msg-${Date.now()}`,
        threadId: thread.id,
        senderRole: "AI",
        senderName: "Hệ thống Điều phối BluePass",
        content:
          "🔔 Bạn đã yêu cầu **Gặp nhân viên tư vấn trực tiếp**. Trạng thái cuộc trò chuyện đã chuyển sang `NEEDS_HUMAN`. Chuyên viên Phòng Đào Tạo đã nhận được thông báo và sẽ trả lời bạn ngay tại khung chat này!",
        createdAt: nowIso,
      };
      thread.messages.push(sysMsg);
      return NextResponse.json({ thread });
    }

    if (action === "STAFF_TAKEOVER") {
      thread.status = "STAFF_ACTIVE";
      thread.assignedStaffName = senderName || "Trần Thanh Thảo (Tư vấn viên)";
      thread.unreadByStaff = false;
      thread.updatedAt = nowIso;

      const joinMsg: ChatMessageItem = {
        id: `msg-${Date.now()}`,
        threadId: thread.id,
        senderRole: "STAFF",
        senderName: thread.assignedStaffName,
        content: `Xin chào ${thread.studentName}, mình là **${thread.assignedStaffName}** từ Phòng Đào Tạo BluePass. Mình đã tiếp nhận cuộc trò chuyện và sẵn sàng hỗ trợ trực tiếp cho bạn!`,
        createdAt: nowIso,
      };
      thread.messages.push(joinMsg);
      return NextResponse.json({ thread });
    }

    if (action === "RETURN_TO_AI") {
      thread.status = targetStatus || "AI_ACTIVE";
      thread.unreadByStaff = false;
      thread.updatedAt = nowIso;

      const aiMsg: ChatMessageItem = {
        id: `msg-${Date.now()}`,
        threadId: thread.id,
        senderRole: "AI",
        senderName: "Trợ lý AI BluePass",
        content:
          "Phiên tư vấn trực tiếp đã hoàn tất. Trợ lý AI BluePass tiếp tục túc trực 24/7 để giải đáp các thắc mắc của bạn!",
        createdAt: nowIso,
      };
      thread.messages.push(aiMsg);
      return NextResponse.json({ thread });
    }

    // 2. Handle Regular Chat Message (Student or Staff)
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Nội dung tin nhắn không được để trống." },
        { status: 400 }
      );
    }

    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      threadId: thread.id,
      senderRole,
      senderName:
        senderName ||
        (senderRole === "STAFF" ? "Tư vấn viên BluePass" : thread.studentName),
      content: content.trim(),
      createdAt: nowIso,
    };

    thread.messages.push(userMsg);
    thread.updatedAt = nowIso;

    if (senderRole === "STAFF") {
      thread.status = "STAFF_ACTIVE";
      thread.unreadByStaff = false;
      thread.unreadByStudent = true;
      return NextResponse.json({ thread });
    }

    // Student sent a message:
    // If thread is already NEEDS_HUMAN or STAFF_ACTIVE, do NOT let AI interrupt human staff!
    if (thread.status === "NEEDS_HUMAN" || thread.status === "STAFF_ACTIVE") {
      thread.unreadByStaff = true;
      return NextResponse.json({ thread });
    }

    // Otherwise thread is AI_ACTIVE -> Generate AI response & check if escalation is needed
    const aiResult = generateAiKnowledgeBaseReply(content);
    if (aiResult.shouldEscalateToHuman) {
      thread.status = "NEEDS_HUMAN";
      thread.unreadByStaff = true;
    }

    const aiMsg: ChatMessageItem = {
      id: `msg-${Date.now() + 1}`,
      threadId: thread.id,
      senderRole: "AI",
      senderName: "Trợ lý AI BluePass",
      content: aiResult.reply,
      createdAt: new Date(Date.now() + 300).toISOString(),
    };

    thread.messages.push(aiMsg);
    saveStoreToDisk(store);

    notifySupportChatToTelegram({
      studentName: thread.studentName,
      studentEmail: thread.studentEmail,
      message: content.trim(),
      needsHuman: aiResult.shouldEscalateToHuman,
    }).catch(() => {});

    return NextResponse.json({ thread });
  } catch {
    return NextResponse.json(
      { error: "Lỗi xử lý tin nhắn trực tuyến." },
      { status: 500 }
    );
  }
}
