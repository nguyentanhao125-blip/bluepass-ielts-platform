import { NextRequest, NextResponse } from "next/server";
import { stripAnswersFromTest } from "@/lib/grading";
import { getStore } from "@/lib/store";
import { TestAttemptItem } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const testIdOrSlug = params.id;
  const userId = req.nextUrl.searchParams.get("userId") || "user-student-1";
  const forceNew = req.nextUrl.searchParams.get("forceNew") === "true";

  const test = store.tests.find(
    (t) => t.id === testIdOrSlug || t.slug === testIdOrSlug
  );

  if (!test) {
    return NextResponse.json(
      { error: "Không tìm thấy đề thi được yêu cầu." },
      { status: 404 }
    );
  }

  const user =
    store.users.find((u) => u.id === userId) || store.users[0];

  const now = new Date();
  const nowMs = now.getTime();

  // Check if student already has an active, non-expired IN_PROGRESS attempt (Crash / F5 Recovery)
  let activeAttempt = !forceNew
    ? store.attempts.find(
        (a) =>
          a.userId === user.id &&
          a.testId === test.id &&
          a.status === "IN_PROGRESS" &&
          new Date(a.expiresAt).getTime() > nowMs
      )
    : undefined;

  if (!activeAttempt) {
    const durationMs = test.durationMinutes * 60 * 1000;
    const expiresAt = new Date(nowMs + durationMs);

    // Compute total max points across all questions in the test
    let totalPoints = 0;
    for (const part of test.parts) {
      for (const group of part.questionGroups) {
        for (const q of group.questions) {
          totalPoints += q.points || 1;
        }
      }
    }

    activeAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      userFullName: user.fullName,
      userEmail: user.email,
      userStudentCode: user.studentCode,
      testId: test.id,
      testTitle: test.title,
      testSkill: test.skill,
      isPlacement: test.isPlacement,
      status: "IN_PROGRESS",
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      draftAnswers: {},
      flaggedQuestions: [],
      rawScore: 0,
      totalQuestions: totalPoints || test.totalQuestions,
      percentageScore: 0,
      bandScore: 0,
      timeSpentSeconds: 0,
      tabSwitchCount: 0,
    } satisfies TestAttemptItem;

    store.attempts.unshift(activeAttempt);
  }

  // STRICT SECURITY: Strip all `correctAnswer`, `explanation`, and `audioTranscript` fields!
  const safeTestPayload = stripAnswersFromTest(test);

  return NextResponse.json({
    attemptId: activeAttempt.id,
    status: activeAttempt.status,
    startedAt: activeAttempt.startedAt,
    expiresAt: activeAttempt.expiresAt,
    serverTime: now.toISOString(),
    draftAnswers: activeAttempt.draftAnswers,
    flaggedQuestions: activeAttempt.flaggedQuestions,
    tabSwitchCount: activeAttempt.tabSwitchCount,
    test: safeTestPayload,
  });
}
