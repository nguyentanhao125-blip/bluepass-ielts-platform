export type Role = "STUDENT" | "STAFF" | "ADMIN";
export type Skill = "READING" | "LISTENING" | "GRAMMAR_VOCAB";
export type TestMode = "SINGLE_PASSAGE" | "FULL_TEST" | "PLACEMENT" | "DICTATION";
export type TestSource =
  | "PRO_PACKAGE"
  | "SIMULATION"
  | "COLLECT_REAL"
  | "CAMBRIDGE_C10_C20"
  | "ACTUAL_TESTS"
  | "OTHER";

export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTI_CHOICE"
  | "TFNG"
  | "YNNG"
  | "MATCHING_HEADINGS"
  | "MATCHING_INFO"
  | "MATCHING_FEATURES"
  | "MAP_DIAGRAM_LABEL"
  | "GAP_FILL";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
export type ChatStatus = "AI_ACTIVE" | "NEEDS_HUMAN" | "STAFF_ACTIVE" | "RESOLVED";
export type SenderRole = "STUDENT" | "AI" | "STAFF";
export type AnnouncementCategory =
  | "PLACEMENT_RESULT"
  | "CLASS_SCHEDULE"
  | "EXAM_NOTICE"
  | "ELIMINATION_NOTICE"
  | "GENERAL";

export interface QuestionOption {
  label: string;
  value: string;
  text: string;
}

export interface QuestionItem {
  id: string;
  groupId: string;
  questionNumber: number;
  prompt: string;
  options?: QuestionOption[];
  correctAnswer?: string; // Stripped when sent to client before submission!
  explanation?: string;   // Stripped when sent to client before submission!
  points: number;
}

export interface SharedOptionItem {
  key: string;
  text: string;
}

export interface QuestionGroupItem {
  id: string;
  partId: string;
  orderIndex: number;
  questionType: QuestionType;
  title: string;
  instructions: string;
  wordLimitNote?: string;
  sharedOptions?: {
    title?: string;
    items?: SharedOptionItem[];
    diagramTitle?: string;
    diagramLabels?: string[];
  };
  questions: QuestionItem[];
}

export interface TestPartItem {
  id: string;
  testId: string;
  partNumber: number;
  title: string;
  subtitle?: string;
  passageHtml?: string;
  audioUrl?: string;
  audioTranscript?: string; // Stripped before submission!
  questionGroups: QuestionGroupItem[];
}

export interface TestItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  skill: Skill;
  mode: TestMode;
  passageNumber: number | null;
  source: TestSource;
  durationMinutes: number;
  totalQuestions: number;
  thumbnailUrl: string;
  attemptCount: number;
  questionTypesSummary: string[];
  isPlacement: boolean;
  isPublished: boolean;
  createdAt: string;
  parts: TestPartItem[];
}

export interface GradedQuestionResult {
  questionId: string;
  questionNumber: number;
  questionType: QuestionType;
  userAnswer: string | string[];
  correctAnswer: string;
  acceptedVariants: string[];
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation: string;
}

export interface TestAttemptItem {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userStudentCode: string;
  testId: string;
  testTitle: string;
  testSkill: Skill;
  isPlacement: boolean;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  draftAnswers: Record<string, string | string[]>;
  flaggedQuestions: number[];
  gradedDetails?: Record<string, GradedQuestionResult>;
  rawScore: number;
  totalQuestions: number;
  percentageScore: number;
  bandScore: number;
  timeSpentSeconds: number;
  tabSwitchCount: number;
}

export interface VocabWordItem {
  id: string;
  deckId: string;
  word: string;
  partOfSpeech: string;
  phonetics: string;
  meaningVi: string;
  definitionEn: string;
  exampleEn: string;
  exampleVi: string;
  synonyms: string[];
}

export interface VocabDeckItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  description: string;
  linkedTestId?: string;
  wordCount: number;
  words: VocabWordItem[];
}

export interface PlacementRow {
  studentCode: string;
  fullName: string;
  score: string;
  band: string;
  assignedClass: string;
  schedule: string;
  room: string;
  status: "ĐẠT - XẾP LỚP" | "CẦN HỌC BỔ TRỢ" | "LOẠI / THI LẠI";
}

export interface AnnouncementItem {
  id: string;
  title: string;
  slug: string;
  category: AnnouncementCategory;
  senderName: string;
  senderDepartment: string;
  contentHtml: string;
  attachmentUrl?: string;
  attachmentName?: string;
  placementData?: PlacementRow[];
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string;
  isNew?: boolean;
}

export interface ChatMessageItem {
  id: string;
  threadId: string;
  senderRole: SenderRole;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface ChatThreadItem {
  id: string;
  userId?: string;
  studentName: string;
  studentEmail: string;
  studentCode?: string;
  status: ChatStatus;
  assignedStaffName?: string;
  subject: string;
  unreadByStaff: boolean;
  unreadByStudent: boolean;
  updatedAt: string;
  messages: ChatMessageItem[];
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  studentCode: string;
  phone: string;
  targetBand: number;
  currentLevel: string;
  role: Role;
  createdAt: string;
}
