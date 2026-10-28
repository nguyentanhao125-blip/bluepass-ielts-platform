import {
  GradedQuestionResult,
  QuestionItem,
  QuestionType,
  TestItem,
} from "./types";

/**
 * Normalizes a string for objective auto-grading:
 * - Converts to lowercase
 * - Replaces curly apostrophes/quotes with standard ASCII
 * - Trims leading/trailing whitespace
 * - Collapses multiple internal spaces into a single space
 * - Strips trailing punctuation like periods
 */
export function normalizeAnswerString(raw: string | undefined | null): string {
  if (!raw) return "";
  return String(raw)
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\.+$/, "")
    .trim();
}

/**
 * Splits a server-side `correctAnswer` field by `|` into all valid normalized variants.
 * Example: "color|colour|the color" -> ["color", "colour", "the color"]
 */
export function getAcceptedAnswerVariants(correctAnswer: string): string[] {
  if (!correctAnswer) return [];
  return correctAnswer
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * 100% Server-Side Objective Question Auto-Grader
 * Supports:
 * - SINGLE_CHOICE, TFNG, YNNG, MATCHING_HEADINGS, MATCHING_INFO, MATCHING_FEATURES, MAP_DIAGRAM_LABEL
 * - MULTI_CHOICE (compares normalized set of selected options, e.g., ["A", "C"] vs "A|C" or "A,C")
 * - GAP_FILL (case-insensitive normalized string match against any `|`-separated variant)
 */
export function gradeObjectiveQuestion(
  question: QuestionItem,
  questionType: QuestionType,
  userRawAnswer: string | string[] | undefined
): GradedQuestionResult {
  const rawCorrect = question.correctAnswer || "";
  const acceptedVariants = getAcceptedAnswerVariants(rawCorrect);
  const maxPoints = question.points || 1;

  let isCorrect = false;
  let formattedUserAnswer: string | string[] = userRawAnswer ?? "";

  if (questionType === "MULTI_CHOICE") {
    // Expected set of options can be separated by `|` or `,` in correctAnswer (e.g., "A|C" or "B,D")
    const expectedSet = rawCorrect
      .split(/[|,]/)
      .map((s) => normalizeAnswerString(s))
      .filter(Boolean)
      .sort();

    const userArray = Array.isArray(userRawAnswer)
      ? userRawAnswer
      : typeof userRawAnswer === "string" && userRawAnswer.trim() !== ""
      ? userRawAnswer.split(/[|,]/).map((s) => s.trim())
      : [];

    formattedUserAnswer = userArray;
    const normalizedUserSet = userArray
      .map((s) => normalizeAnswerString(s))
      .filter(Boolean)
      .sort();

    if (
      expectedSet.length > 0 &&
      normalizedUserSet.length === expectedSet.length &&
      normalizedUserSet.every((val, idx) => val === expectedSet[idx])
    ) {
      isCorrect = true;
    }
  } else {
    // Single string comparison against all `|`-separated accepted variants
    const singleUserStr = Array.isArray(userRawAnswer)
      ? userRawAnswer.join(" ")
      : String(userRawAnswer ?? "");
    formattedUserAnswer = singleUserStr.trim();

    const normalizedUser = normalizeAnswerString(singleUserStr);
    if (normalizedUser.length > 0) {
      isCorrect = acceptedVariants.some(
        (variant) => normalizeAnswerString(variant) === normalizedUser
      );
    }
  }

  return {
    questionId: question.id,
    questionNumber: question.questionNumber,
    questionType,
    userAnswer: formattedUserAnswer,
    correctAnswer: rawCorrect,
    acceptedVariants,
    isCorrect,
    pointsEarned: isCorrect ? maxPoints : 0,
    maxPoints,
    explanation:
      question.explanation ||
      "Đáp án được chấm tự động theo chuẩn đáp án gốc của hội đồng khảo thí.",
  };
}

/**
 * Strips `correctAnswer`, `explanation`, and `audioTranscript` from a Test object
 * BEFORE sending to the client in `GET /api/tests/[id]/start` to guarantee ZERO Answer Leakage.
 */
export function stripAnswersFromTest(test: TestItem): TestItem {
  return {
    ...test,
    parts: test.parts.map((part) => ({
      ...part,
      audioTranscript: undefined, // Never leak listening transcript during an active exam
      questionGroups: part.questionGroups.map((group) => ({
        ...group,
        questions: group.questions.map((q) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { correctAnswer, explanation, ...safeQuestion } = q;
          return safeQuestion;
        }),
      })),
    })),
  };
}

/**
 * Converts accuracy percentage to IELTS Band (0.0 - 9.0 in 0.5 increments)
 */
export function calculateIeltsBand(rawScore: number, totalQuestions: number): number {
  if (totalQuestions <= 0 || rawScore <= 0) return 0.0;
  const ratio = rawScore / totalQuestions;
  if (ratio >= 0.97) return 9.0;
  if (ratio >= 0.91) return 8.5;
  if (ratio >= 0.85) return 8.0;
  if (ratio >= 0.78) return 7.5;
  if (ratio >= 0.70) return 7.0;
  if (ratio >= 0.60) return 6.5;
  if (ratio >= 0.50) return 6.0;
  if (ratio >= 0.40) return 5.5;
  if (ratio >= 0.30) return 5.0;
  if (ratio >= 0.22) return 4.5;
  if (ratio >= 0.15) return 4.0;
  return 3.5;
}

/**
 * Suggests a class level label based on percentage score (for Admin Ranking Table export/review)
 */
export function suggestPlacementClass(percentage: number): string {
  if (percentage >= 85) return "IELTS Intensive 7.5+ (C1)";
  if (percentage >= 70) return "IELTS Fighter 6.5 (B2+)";
  if (percentage >= 55) return "IELTS Pre-Intermediate 5.5 (B1)";
  if (percentage >= 40) return "IELTS Foundation 4.5 (A2)";
  return "Lớp Bổ Trợ Nền Tảng (Pre-A2)";
}
