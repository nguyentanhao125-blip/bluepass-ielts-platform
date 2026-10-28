import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = getStore();
    const body = await req.json();
    const {
      attemptId,
      draftAnswers,
      flaggedQuestions,
      tabSwitchCount,
    }: {
      attemptId: string;
      draftAnswers?: Record<string, string | string[]>;
      flaggedQuestions?: number[];
      tabSwitchCount?: number;
    } = body;

    if (!attemptId) {
      return NextResponse.json(
        { error: "Thiếu mã phiên làm bài (attemptId)." },
        { status: 400 }
      );
    }

    const attempt = store.attempts.find(
      (a) => a.id === attemptId && (a.testId === params.id || true)
    );

    if (!attempt) {
      return NextResponse.json(
        { error: "Không tìm thấy phiên làm bài." },
        { status: 404 }
      );
    }

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          error: "Phiên làm bài đã kết thúc hoặc đã nộp, không thể lưu nháp thêm.",
          status: attempt.status,
        },
        { status: 409 }
      );
    }

    const nowMs = Date.now();
    const expiresMs = new Date(attempt.expiresAt).getTime();
    const graceMs = 30 * 1000;

    if (nowMs > expiresMs + graceMs) {
      return NextResponse.json(
        {
          error: "Thời gian làm bài trên máy chủ đã kết thúc.",
          expired: true,
        },
        { status: 410 }
      );
    }

    if (draftAnswers && typeof draftAnswers === "object") {
      attempt.draftAnswers = {
        ...attempt.draftAnswers,
        ...draftAnswers,
      };
    }

    if (Array.isArray(flaggedQuestions)) {
      attempt.flaggedQuestions = flaggedQuestions;
    }

    if (typeof tabSwitchCount === "number" && tabSwitchCount > attempt.tabSwitchCount) {
      attempt.tabSwitchCount = tabSwitchCount;
    }

    return NextResponse.json({
      saved: true,
      savedAt: new Date(nowMs).toISOString(),
      attemptId: attempt.id,
      tabSwitchCount: attempt.tabSwitchCount,
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi máy chủ khi lưu nháp tự động." },
      { status: 500 }
    );
  }
}
