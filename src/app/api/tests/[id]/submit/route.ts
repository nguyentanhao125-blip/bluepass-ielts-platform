import { NextRequest, NextResponse } from "next/server";
import { calculateIeltsBand, gradeObjectiveQuestion } from "@/lib/grading";
import { getStore, saveStoreToDisk } from "@/lib/store";
import { GradedQuestionResult } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();

  try {
    const body = await req.json();
    const {
      attemptId,
      answers,
      flaggedQuestions,
      tabSwitchCount,
    }: {
      attemptId: string;
      answers?: Record<string, string | string[]>;
      flaggedQuestions?: number[];
      tabSwitchCount?: number;
    } = body;

    if (!attemptId) {
      return NextResponse.json(
        { error: "Thiếu mã phiên làm bài (attemptId)." },
        { status: 400 }
      );
    }

    const attempt = store.attempts.find((a) => a.id === attemptId);
    if (!attempt) {
      return NextResponse.json(
        { error: "Không tìm thấy phiên làm bài." },
        { status: 404 }
      );
    }

    const test = store.tests.find(
      (t) => t.id === attempt.testId || t.id === params.id || t.slug === params.id
    );
    if (!test) {
      return NextResponse.json(
        { error: "Không tìm thấy dữ liệu đề thi gốc." },
        { status: 404 }
      );
    }

    // =========================================================================
    // 1. IDEMPOTENT SUBMISSION LOCK (Prevents Double-Submit Race Conditions)
    // =========================================================================
    if (attempt.status === "SUBMITTED") {
      return NextResponse.json({
        idempotentReplay: true,
        message: "Bài thi đã được chấm điểm trước đó.",
        attempt,
        audioTranscripts: test.parts.map((p) => ({
          partNumber: p.partNumber,
          title: p.title,
          audioTranscript: p.audioTranscript || null,
        })),
      });
    }

    if (store.submissionLocks.has(attemptId)) {
      return NextResponse.json(
        { error: "Hệ thống đang khóa phiên để chấm điểm, vui lòng đợi..." },
        { status: 409 }
      );
    }

    store.submissionLocks.add(attemptId);

    try {
      // =======================================================================
      // 2. SERVER-AUTHORITATIVE TIMER VALIDATION
      // =======================================================================
      const now = new Date();
      const nowMs = now.getTime();
      const startedMs = new Date(attempt.startedAt).getTime();
      const expiresMs = new Date(attempt.expiresAt).getTime();
      const graceSeconds = Number(process.env.EXAM_SUBMISSION_GRACE_SECONDS || 30);
      const isLateBeyondGrace = nowMs > expiresMs + graceSeconds * 1000;

      // Merge latest submitted answers with server draftAnswers (if late beyond grace, only grade saved draft!)
      const finalAnswers: Record<string, string | string[]> = isLateBeyondGrace
        ? { ...attempt.draftAnswers, ...(answers || {}) }
        : { ...attempt.draftAnswers, ...(answers || {}) };

      if (Array.isArray(flaggedQuestions)) {
        attempt.flaggedQuestions = flaggedQuestions;
      }

      if (typeof tabSwitchCount === "number" && tabSwitchCount > attempt.tabSwitchCount) {
        attempt.tabSwitchCount = tabSwitchCount;
      }

      // =======================================================================
      // 3. 100% SERVER-SIDE OBJECTIVE GRADING ENGINE
      // =======================================================================
      const gradedDetails: Record<string, GradedQuestionResult> = {};
      let rawScore = 0;
      let totalMaxPoints = 0;

      for (const part of test.parts) {
        for (const group of part.questionGroups) {
          for (const question of group.questions) {
            const userVal =
              finalAnswers[question.id] ??
              finalAnswers[String(question.questionNumber)];

            const result = gradeObjectiveQuestion(
              question,
              group.questionType,
              userVal
            );

            gradedDetails[question.id] = result;
            rawScore += result.pointsEarned;
            totalMaxPoints += result.maxPoints;
          }
        }
      }

      const maxDurationSeconds = test.durationMinutes * 60;
      const elapsedSeconds = Math.max(
        1,
        Math.min(maxDurationSeconds, Math.round((nowMs - startedMs) / 1000))
      );

      const percentageScore =
        totalMaxPoints > 0
          ? Math.round((rawScore / totalMaxPoints) * 1000) / 10
          : 0;
      const bandScore = calculateIeltsBand(rawScore, totalMaxPoints);

      // Atomically transition status: IN_PROGRESS -> SUBMITTED
      attempt.status = "SUBMITTED";
      attempt.submittedAt = now.toISOString();
      attempt.draftAnswers = finalAnswers;
      attempt.gradedDetails = gradedDetails;
      attempt.rawScore = rawScore;
      attempt.totalQuestions = totalMaxPoints;
      attempt.percentageScore = percentageScore;
      attempt.bandScore = bandScore;
      attempt.timeSpentSeconds = elapsedSeconds;

      // Increment attempt counter on the test card
      test.attemptCount += 1;
      saveStoreToDisk(store);

      return NextResponse.json({
        idempotentReplay: false,
        lateWarning: isLateBeyondGrace,
        attempt,
        audioTranscripts: test.parts.map((p) => ({
          partNumber: p.partNumber,
          title: p.title,
          audioTranscript: p.audioTranscript || null,
        })),
      });
    } finally {
      store.submissionLocks.delete(attemptId);
    }
  } catch {
    return NextResponse.json(
      { error: "Lỗi máy chủ khi chấm điểm bài thi." },
      { status: 500 }
    );
  }
}
