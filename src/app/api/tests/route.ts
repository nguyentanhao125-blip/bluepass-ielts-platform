import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { getStore, saveStoreToDisk } from "@/lib/store";
import {
  QuestionGroupItem,
  QuestionItem,
  QuestionType,
  Skill,
  TestItem,
  TestMode,
  TestSource,
} from "@/lib/types";

export async function GET(req: NextRequest) {
  const store = getStore();
  const { searchParams } = req.nextUrl;

  const skill = searchParams.get("skill");
  const mode = searchParams.get("mode");
  const passageNumber = searchParams.get("passageNumber");
  const sources = searchParams.getAll("source");
  const questionTypes = searchParams.getAll("questionType");
  const search = searchParams.get("q")?.toLowerCase().trim() || "";
  const userId = searchParams.get("userId") || "user-student-1";

  const userSubmittedTestIds = new Set(
    store.attempts
      .filter((a) => a.userId === userId && a.status === "SUBMITTED")
      .map((a) => a.testId)
  );

  const filtered = store.tests
    .filter((t) => {
      if (!t.isPublished) return false;
      if (skill && t.skill !== skill) return false;
      if (mode && t.mode !== mode) return false;
      if (passageNumber && String(t.passageNumber) !== passageNumber) return false;
      if (sources.length > 0 && !sources.includes(t.source)) return false;
      if (
        questionTypes.length > 0 &&
        !questionTypes.some((qt) => t.questionTypesSummary.includes(qt))
      ) {
        return false;
      }
      if (
        search &&
        !t.title.toLowerCase().includes(search) &&
        !(t.description || "").toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    })
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      skill: t.skill,
      mode: t.mode,
      passageNumber: t.passageNumber,
      source: t.source,
      durationMinutes: t.durationMinutes,
      totalQuestions: t.totalQuestions,
      thumbnailUrl: t.thumbnailUrl,
      attemptCount: t.attemptCount,
      questionTypesSummary: t.questionTypesSummary,
      isPlacement: t.isPlacement,
      isCompletedByUser: userSubmittedTestIds.has(t.id),
    }));

  const userAttempts = store.attempts.filter(
    (a) => a.userId === userId && a.status === "SUBMITTED"
  );

  return NextResponse.json({
    tests: filtered,
    completedTestIds: Array.from(userSubmittedTestIds),
    recentAttempts: userAttempts.slice(0, 10),
  });
}

/**
 * POST /api/tests - Admin uploads / creates a new Objective Test directly from the Web Dashboard
 */
export async function POST(req: NextRequest) {
  try {
    // STRICT RBAC: Only ADMIN is allowed to upload/create exams
    const caller = getAuthenticatedUser(req);
    if (!caller || caller.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Truy cập bị từ chối (403 Forbidden): Chỉ tài khoản Quản trị viên (ADMIN) mới có quyền đăng tải đề thi!",
        },
        { status: 403 }
      );
    }

    const store = getStore();
    const body = await req.json();

    const {
      title,
      description,
      skill = "READING",
      mode = "SINGLE_PASSAGE",
      passageNumber = 1,
      source = "COLLECT_REAL",
      durationMinutes = 20,
      thumbnailUrl,
      isPlacement = false,
      passageHtml,
      audioUrl,
      audioTranscript,
      questionType = "GAP_FILL",
      questions = [],
    }: {
      title: string;
      description?: string;
      skill?: Skill;
      mode?: TestMode;
      passageNumber?: number | null;
      source?: TestSource;
      durationMinutes?: number;
      thumbnailUrl?: string;
      isPlacement?: boolean;
      passageHtml?: string;
      audioUrl?: string;
      audioTranscript?: string;
      questionType?: QuestionType;
      questions?: {
        prompt: string;
        correctAnswer: string;
        explanation?: string;
        optionsText?: string; // Optional A|B|C|D for single choice
      }[];
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập Tên đề thi." },
        { status: 400 }
      );
    }

    const testId = `test-custom-${Date.now()}`;
    const partId = `part-${Date.now()}`;
    const groupId = `qg-${Date.now()}`;

    const builtQuestions: QuestionItem[] = (
      questions.length > 0
        ? questions
        : [
            {
              prompt: "Sample Question 1: Fill in the missing keyword ________.",
              correctAnswer: "answer",
              explanation: "Giải thích đáp án chuẩn của giáo viên.",
            },
          ]
    ).map((q, idx) => {
      let options = undefined;
      if (questionType === "TFNG") {
        options = [
          { label: "TRUE", value: "TRUE", text: "TRUE" },
          { label: "FALSE", value: "FALSE", text: "FALSE" },
          { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
        ];
      } else if (questionType === "YNNG") {
        options = [
          { label: "YES", value: "YES", text: "YES" },
          { label: "NO", value: "NO", text: "NO" },
          { label: "NOT GIVEN", value: "NOT GIVEN", text: "NOT GIVEN" },
        ];
      } else if (questionType === "SINGLE_CHOICE") {
        const rawOpts = (q.optionsText || "Option A|Option B|Option C|Option D")
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        options = rawOpts.map((text, i) => ({
          label: String.fromCharCode(65 + i),
          value: String.fromCharCode(65 + i),
          text,
        }));
      }

      return {
        id: `q-${Date.now()}-${idx + 1}`,
        groupId,
        questionNumber: idx + 1,
        prompt: q.prompt,
        options,
        correctAnswer: q.correctAnswer.trim(),
        explanation:
          q.explanation?.trim() || "Đáp án chuẩn do Ban Chuyên Môn cập nhật.",
        points: 1,
      };
    });

    const qTypeLabelMap: Record<QuestionType, string> = {
      GAP_FILL: "Gap Filling",
      TFNG: "True - False - Not Given",
      YNNG: "Yes - No - Not Given",
      SINGLE_CHOICE: "Multiple Choice (One Answer)",
      MULTI_CHOICE: "Multiple Choice (Many Answers)",
      MATCHING_HEADINGS: "Matching Headings",
      MATCHING_INFO: "Matching Information",
      MATCHING_FEATURES: "Matching Features",
      MAP_DIAGRAM_LABEL: "Map, Diagram Label",
    };

    const newTest: TestItem = {
      id: testId,
      slug: `de-thi-${Date.now()}`,
      title: title.trim(),
      description:
        description?.trim() ||
        "Đề thi trắc nghiệm khách quan được đăng tải từ Trung tâm Quản trị Admin.",
      skill,
      mode: isPlacement ? "PLACEMENT" : mode,
      passageNumber: mode === "FULL_TEST" || isPlacement ? null : Number(passageNumber) || 1,
      source,
      durationMinutes: Number(durationMinutes) || 20,
      totalQuestions: builtQuestions.length,
      thumbnailUrl:
        thumbnailUrl?.trim() ||
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
      attemptCount: 1,
      questionTypesSummary: [qTypeLabelMap[questionType] || "Gap Filling"],
      isPlacement: Boolean(isPlacement),
      isPublished: true,
      createdAt: new Date().toISOString(),
      parts: [
        {
          id: partId,
          testId,
          partNumber: 1,
          title:
            skill === "LISTENING"
              ? `LISTENING PART ${passageNumber || 1}`
              : `READING PASSAGE ${passageNumber || 1}`,
          subtitle: `Complete Questions 1–${builtQuestions.length} within ${durationMinutes} minutes.`,
          passageHtml:
            passageHtml ||
            `<div class="space-y-4 leading-relaxed text-slate-800"><h2 class="text-xl font-bold text-slate-900">${title}</h2><p>Nội dung bài đọc học thuật do Admin đăng tải.</p></div>`,
          audioUrl:
            skill === "LISTENING"
              ? audioUrl || "/api/audio/northside-sports-centre"
              : undefined,
          audioTranscript: audioTranscript || undefined,
          questionGroups: [
            {
              id: groupId,
              partId,
              orderIndex: 1,
              questionType,
              title: `Questions 1 – ${builtQuestions.length}: ${
                qTypeLabelMap[questionType] || "Objective Questions"
              }`,
              instructions:
                questionType === "GAP_FILL"
                  ? "Write ONE WORD AND/OR A NUMBER for each answer."
                  : "Choose the correct answer for each question.",
              wordLimitNote:
                questionType === "GAP_FILL" ? "ONE WORD ONLY" : undefined,
              questions: builtQuestions,
            },
          ],
        },
      ],
    };

    store.tests.unshift(newTest);
    saveStoreToDisk(store);

    return NextResponse.json({
      success: true,
      message: "Đã đăng tải đề thi mới thành công!",
      test: newTest,
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi máy chủ khi tạo đề thi mới." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tests?id=... - Admin deletes a test from the platform
 */
export async function DELETE(req: NextRequest) {
  // STRICT RBAC: Only ADMIN is allowed to delete exams
  const caller = getAuthenticatedUser(req);
  if (!caller || caller.role !== "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Truy cập bị từ chối (403 Forbidden): Học sinh và Tư vấn viên không có quyền xóa đề thi!",
      },
      { status: 403 }
    );
  }

  const store = getStore();
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Thiếu mã đề thi (id) cần xóa." },
      { status: 400 }
    );
  }

  const index = store.tests.findIndex((t) => t.id === id);
  if (index === -1) {
    return NextResponse.json(
      { error: "Không tìm thấy đề thi cần xóa." },
      { status: 404 }
    );
  }

  const removed = store.tests.splice(index, 1)[0];
  saveStoreToDisk(store);

  return NextResponse.json({
    success: true,
    message: `Đã xóa đề thi "${removed.title}" khỏi hệ thống.`,
    deletedId: id,
  });
}
