import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  AnnouncementItem,
  ChatThreadItem,
  TestAttemptItem,
  TestItem,
  UserProfile,
  VocabDeckItem,
} from "./types";

export interface SyncableStoreState {
  users: UserProfile[];
  passwordHashes?: Record<string, string>;
  tests: TestItem[];
  attempts: TestAttemptItem[];
  announcements: AnnouncementItem[];
  vocabDecks: VocabDeckItem[];
  vocabProgress?: Record<string, "NEW" | "LEARNING" | "MASTERED">;
  chatThreads: ChatThreadItem[];
}

let defaultBcryptHashCache: string | null = null;

async function getDefaultPasswordHash(): Promise<string> {
  if (!defaultBcryptHashCache) {
    defaultBcryptHashCache = await bcrypt.hash("123456", 10);
  }
  return defaultBcryptHashCache;
}

export async function syncStateToPrismaClient(
  client: PrismaClient,
  state: SyncableStoreState
) {
  const defaultHash = await getDefaultPasswordHash();

  // 1. Collect all Users (including any student referenced in attempts)
  const userMap = new Map<string, UserProfile>();
  for (const u of state.users) {
    userMap.set(u.id, u);
  }
  for (const att of state.attempts) {
    if (!userMap.has(att.userId)) {
      userMap.set(att.userId, {
        id: att.userId,
        email: att.userEmail || `${att.userId}@student.edu.vn`,
        fullName: att.userFullName || "Học viên BluePass",
        studentCode: att.userStudentCode || `HV-${att.userId.toUpperCase()}`,
        phone: "0901234567",
        targetBand: Math.max(6.5, att.bandScore || 7.0),
        currentLevel: att.bandScore >= 7.5 ? "C1 - Advanced" : "B2 - Upper Intermediate",
        role: "STUDENT",
        createdAt: att.startedAt || new Date().toISOString(),
      });
    }
  }

  const allUsers = Array.from(userMap.values());
  for (const u of allUsers) {
    const rawPw = state.passwordHashes?.[u.email.toLowerCase()];
    const pwHash =
      rawPw && rawPw.startsWith("$2")
        ? rawPw
        : rawPw
        ? await bcrypt.hash(rawPw, 10)
        : defaultHash;

    await client.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        studentCode: u.studentCode,
        phone: u.phone,
        targetBand: u.targetBand,
        currentLevel: u.currentLevel,
        role: u.role,
      },
      create: {
        id: u.id,
        email: u.email,
        passwordHash: pwHash,
        fullName: u.fullName,
        studentCode: u.studentCode,
        phone: u.phone,
        targetBand: u.targetBand,
        currentLevel: u.currentLevel,
        role: u.role,
        emailVerified: new Date(),
      },
    });
  }

  // 2. Sync Tests (and delete any tests removed by Admin)
  const currentTestIds = state.tests.map((t) => t.id);
  await client.test.deleteMany({
    where: {
      id: { notIn: currentTestIds },
    },
  });

  let totalParts = 0;
  let totalGroups = 0;
  let totalQuestionsCount = 0;

  for (const t of state.tests) {
    await client.test.upsert({
      where: { slug: t.slug },
      update: {
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
        isPublished: t.isPublished,
      },
      create: {
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
        isPublished: t.isPublished,
      },
    });

    for (const part of t.parts || []) {
      totalParts++;
      await client.testPart.upsert({
        where: { id: part.id },
        update: {
          partNumber: part.partNumber,
          title: part.title,
          subtitle: part.subtitle,
          passageHtml: part.passageHtml,
          audioUrl: part.audioUrl,
          audioTranscript: part.audioTranscript,
        },
        create: {
          id: part.id,
          testId: t.id,
          partNumber: part.partNumber,
          title: part.title,
          subtitle: part.subtitle,
          passageHtml: part.passageHtml,
          audioUrl: part.audioUrl,
          audioTranscript: part.audioTranscript,
        },
      });

      for (const group of part.questionGroups || []) {
        totalGroups++;
        await client.questionGroup.upsert({
          where: { id: group.id },
          update: {
            orderIndex: group.orderIndex,
            questionType: group.questionType,
            title: group.title,
            instructions: group.instructions,
            wordLimitNote: group.wordLimitNote,
            sharedOptions: group.sharedOptions ? (group.sharedOptions as object) : undefined,
          },
          create: {
            id: group.id,
            partId: part.id,
            orderIndex: group.orderIndex,
            questionType: group.questionType,
            title: group.title,
            instructions: group.instructions,
            wordLimitNote: group.wordLimitNote,
            sharedOptions: group.sharedOptions ? (group.sharedOptions as object) : undefined,
          },
        });

        for (const q of group.questions || []) {
          totalQuestionsCount++;
          await client.question.upsert({
            where: { id: q.id },
            update: {
              questionNumber: q.questionNumber,
              prompt: q.prompt,
              options: q.options ? (q.options as object) : undefined,
              correctAnswer: q.correctAnswer || "",
              explanation: q.explanation || "",
              points: q.points || 1,
            },
            create: {
              id: q.id,
              groupId: group.id,
              questionNumber: q.questionNumber,
              prompt: q.prompt,
              options: q.options ? (q.options as object) : undefined,
              correctAnswer: q.correctAnswer || "",
              explanation: q.explanation || "",
              points: q.points || 1,
            },
          });
        }
      }
    }
  }

  // 3. Sync TestAttempts
  let syncedAttempts = 0;
  for (const att of state.attempts) {
    const dbUser =
      (await client.user.findUnique({ where: { id: att.userId } })) ||
      (await client.user.findUnique({ where: { email: att.userEmail } }));
    const dbTest = await client.test.findUnique({ where: { id: att.testId } });
    if (!dbUser || !dbTest) continue;

    syncedAttempts++;
    await client.testAttempt.upsert({
      where: { id: att.id },
      update: {
        status: att.status,
        submittedAt: att.submittedAt ? new Date(att.submittedAt) : null,
        draftAnswers: (att.draftAnswers || {}) as object,
        flaggedQuestions: (att.flaggedQuestions || []) as object,
        gradedDetails: att.gradedDetails ? (att.gradedDetails as object) : undefined,
        rawScore: att.rawScore,
        totalQuestions: att.totalQuestions,
        percentageScore: att.percentageScore,
        bandScore: att.bandScore,
        timeSpentSeconds: att.timeSpentSeconds,
        tabSwitchCount: att.tabSwitchCount,
      },
      create: {
        id: att.id,
        userId: dbUser.id,
        testId: dbTest.id,
        status: att.status,
        startedAt: new Date(att.startedAt),
        expiresAt: new Date(att.expiresAt),
        submittedAt: att.submittedAt ? new Date(att.submittedAt) : null,
        draftAnswers: (att.draftAnswers || {}) as object,
        flaggedQuestions: (att.flaggedQuestions || []) as object,
        gradedDetails: att.gradedDetails ? (att.gradedDetails as object) : undefined,
        rawScore: att.rawScore,
        totalQuestions: att.totalQuestions,
        percentageScore: att.percentageScore,
        bandScore: att.bandScore,
        timeSpentSeconds: att.timeSpentSeconds,
        tabSwitchCount: att.tabSwitchCount,
      },
    });
  }

  // 4. Sync VocabDecks, VocabWords, and VocabProgress
  let totalWords = 0;
  for (const deck of state.vocabDecks) {
    const linkedTestExists = deck.linkedTestId
      ? await client.test.findUnique({ where: { id: deck.linkedTestId } })
      : null;

    await client.vocabDeck.upsert({
      where: { slug: deck.slug },
      update: {
        title: deck.title,
        category: deck.category,
        level: deck.level,
        description: deck.description,
        linkedTestId: linkedTestExists ? deck.linkedTestId : null,
        wordCount: deck.wordCount,
      },
      create: {
        id: deck.id,
        title: deck.title,
        slug: deck.slug,
        category: deck.category,
        level: deck.level,
        description: deck.description,
        linkedTestId: linkedTestExists ? deck.linkedTestId : null,
        wordCount: deck.wordCount,
      },
    });

    for (const w of deck.words || []) {
      totalWords++;
      await client.vocabWord.upsert({
        where: { id: w.id },
        update: {
          word: w.word,
          partOfSpeech: w.partOfSpeech,
          phonetics: w.phonetics,
          meaningVi: w.meaningVi,
          definitionEn: w.definitionEn,
          exampleEn: w.exampleEn,
          exampleVi: w.exampleVi,
          synonyms: w.synonyms,
        },
        create: {
          id: w.id,
          deckId: deck.id,
          word: w.word,
          partOfSpeech: w.partOfSpeech,
          phonetics: w.phonetics,
          meaningVi: w.meaningVi,
          definitionEn: w.definitionEn,
          exampleEn: w.exampleEn,
          exampleVi: w.exampleVi,
          synonyms: w.synonyms,
        },
      });
    }
  }

  if (state.vocabProgress) {
    for (const [key, status] of Object.entries(state.vocabProgress)) {
      const [userId, wordId] = key.split(":");
      if (!userId || !wordId) continue;
      const uExists = await client.user.findUnique({ where: { id: userId } });
      const wExists = await client.vocabWord.findUnique({ where: { id: wordId } });
      if (!uExists || !wExists) continue;

      await client.vocabProgress.upsert({
        where: {
          userId_wordId: { userId, wordId },
        },
        update: {
          status,
          lastReviewedAt: new Date(),
        },
        create: {
          userId,
          wordId,
          status,
          correctCount: status === "MASTERED" ? 3 : 1,
        },
      });
    }
  }

  // 5. Sync Announcements
  for (const ann of state.announcements) {
    await client.announcement.upsert({
      where: { slug: ann.slug },
      update: {
        title: ann.title,
        category: ann.category,
        senderName: ann.senderName,
        senderDepartment: ann.senderDepartment,
        contentHtml: ann.contentHtml,
        attachmentName: ann.attachmentName,
        attachmentUrl: ann.attachmentUrl,
        placementData: ann.placementData ? (ann.placementData as object) : undefined,
        isPinned: ann.isPinned,
        isPublished: ann.isPublished,
      },
      create: {
        id: ann.id,
        title: ann.title,
        slug: ann.slug,
        category: ann.category,
        senderName: ann.senderName,
        senderDepartment: ann.senderDepartment,
        contentHtml: ann.contentHtml,
        attachmentName: ann.attachmentName,
        attachmentUrl: ann.attachmentUrl,
        placementData: ann.placementData ? (ann.placementData as object) : undefined,
        isPinned: ann.isPinned,
        isPublished: ann.isPublished,
        publishedAt: new Date(ann.publishedAt),
      },
    });
  }

  // 6. Sync ChatThreads & ChatMessages
  let totalChatMessages = 0;
  for (const thread of state.chatThreads) {
    const userExists = thread.userId
      ? await client.user.findUnique({ where: { id: thread.userId } })
      : null;

    await client.chatThread.upsert({
      where: { id: thread.id },
      update: {
        guestName: thread.studentName,
        guestEmail: thread.studentEmail,
        status: thread.status,
        subject: thread.subject,
        unreadByStaff: thread.unreadByStaff,
        unreadByStudent: thread.unreadByStudent,
      },
      create: {
        id: thread.id,
        userId: userExists ? thread.userId : null,
        guestName: thread.studentName,
        guestEmail: thread.studentEmail,
        status: thread.status,
        subject: thread.subject,
        unreadByStaff: thread.unreadByStaff,
        unreadByStudent: thread.unreadByStudent,
      },
    });

    for (const msg of thread.messages || []) {
      totalChatMessages++;
      await client.chatMessage.upsert({
        where: { id: msg.id },
        update: {
          senderRole: msg.senderRole,
          senderName: msg.senderName,
          content: msg.content,
        },
        create: {
          id: msg.id,
          threadId: thread.id,
          senderRole: msg.senderRole,
          senderName: msg.senderName,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
        },
      });
    }
  }

  return {
    users: allUsers.length,
    tests: state.tests.length,
    parts: totalParts,
    groups: totalGroups,
    questions: totalQuestionsCount,
    attempts: syncedAttempts,
    vocabDecks: state.vocabDecks.length,
    vocabWords: totalWords,
    announcements: state.announcements.length,
    chatThreads: state.chatThreads.length,
    chatMessages: totalChatMessages,
  };
}
