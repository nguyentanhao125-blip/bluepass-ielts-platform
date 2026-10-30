import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { generateAiKnowledgeBaseReply, getStore, saveStoreToDisk } from "@/lib/store";
import { notifySupportChatToTelegram } from "@/lib/telegram";
import { ChatMessageItem, ChatStatus, ChatThreadItem, SenderRole } from "@/lib/types";

export async function GET(req: NextRequest) {
  const store = getStore();
  const threadId = req.nextUrl.searchParams.get("threadId");
  const mode = req.nextUrl.searchParams.get("mode"); // "staff" returns all threads

  if (mode === "staff") {
    const caller = getAuthenticatedUser(req);
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "STAFF")) {
      return NextResponse.json(
        {
          error:
            "Truy cập bị từ chối (403 Forbidden): Chỉ Quản trị viên hoặc Tư vấn viên mới được xem toàn bộ hộp thư học viên.",
        },
        { status: 403 }
      );
    }

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

  const caller = getAuthenticatedUser(req);
  let thread = store.chatThreads.find((t) => t.id === threadId);

  // If the student does not have a dedicated thread yet, create or return their personal thread
  if (!thread && caller && caller.role === "STUDENT") {
    thread = store.chatThreads.find((t) => t.studentEmail === caller.email);
  }
  if (!thread) {
    thread = store.chatThreads[0];
  }

  return NextResponse.json({
    thread,
  });
}

export async function POST(req: NextRequest) {
  try {
    const store = getStore();
    const caller = getAuthenticatedUser(req);
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

    // Enforce RBAC for Staff-only actions
    if (action === "STAFF_TAKEOVER" || senderRole === "STAFF") {
      if (!caller || (caller.role !== "ADMIN" && caller.role !== "STAFF")) {
        return NextResponse.json(
          {
            error:
              "Truy cập bị từ chối (403 Forbidden): Học viên không thể giả mạo phản hồi của Tư vấn viên.",
          },
          { status: 403 }
        );
      }
    }

    let thread = store.chatThreads.find((t) => t.id === threadId);
    const nowIso = new Date().toISOString();

    if (!thread && caller && caller.role === "STUDENT") {
      const newThread: ChatThreadItem = {
        id: threadId.startsWith("thread-") ? threadId : `thread-${caller.id}`,
        studentName: caller.fullName,
        studentEmail: caller.email,
        studentCode: caller.studentCode,
        subject: "Tư vấn lộ trình & Hỗ trợ học viên",
        status: "AI_ACTIVE",
        unreadByStaff: false,
        unreadByStudent: false,
        updatedAt: nowIso,
        messages: [
          {
            id: `msg-welcome-${Date.now()}`,
            threadId: threadId.startsWith("thread-") ? threadId : `thread-${caller.id}`,
            senderRole: "AI",
            senderName: "Trợ lý AI BluePass",
            content: `Xin chào ${caller.fullName} (${caller.studentCode})! Mình là Trợ lý AI học thuật của BluePass. Bạn cần tư vấn về kết quả Thi Xếp Lớp, lộ trình IELTS hay đặt lịch với Giáo viên?`,
            createdAt: nowIso,
          },
        ],
      };
      store.chatThreads.unshift(newThread);
      thread = newThread;
    }

    if (!thread) {
      thread = store.chatThreads[0];
    }

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
      saveStoreToDisk(store);
      return NextResponse.json({ thread });
    }

    if (action === "STAFF_TAKEOVER") {
      thread.status = "STAFF_ACTIVE";
      thread.assignedStaffName = senderName || caller?.fullName || "Trần Thanh Thảo (Tư vấn viên)";
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
      saveStoreToDisk(store);
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
      saveStoreToDisk(store);
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
      saveStoreToDisk(store);
      return NextResponse.json({ thread });
    }

    // Student sent a message:
    // If thread is already NEEDS_HUMAN or STAFF_ACTIVE, do NOT let AI interrupt human staff!
    if (thread.status === "NEEDS_HUMAN" || thread.status === "STAFF_ACTIVE") {
      thread.unreadByStaff = true;
      saveStoreToDisk(store);
      notifySupportChatToTelegram({
        studentName: thread.studentName,
        studentEmail: thread.studentEmail,
        message: content.trim(),
        needsHuman: true,
      }).catch(() => {});
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
