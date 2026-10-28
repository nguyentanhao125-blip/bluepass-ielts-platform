import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_TESTS,
  INITIAL_USERS,
  INITIAL_VOCAB_DECKS,
} from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding BluePass English Objective Testing Platform database...");

  const defaultHash = await bcrypt.hash("123456", 10);

  for (const u of INITIAL_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        passwordHash: defaultHash,
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

  for (const t of INITIAL_TESTS) {
    await prisma.test.upsert({
      where: { slug: t.slug },
      update: {},
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
  }

  for (const deck of INITIAL_VOCAB_DECKS) {
    await prisma.vocabDeck.upsert({
      where: { slug: deck.slug },
      update: {},
      create: {
        id: deck.id,
        title: deck.title,
        slug: deck.slug,
        category: deck.category,
        level: deck.level,
        description: deck.description,
        linkedTestId: deck.linkedTestId,
        wordCount: deck.wordCount,
      },
    });
  }

  for (const ann of INITIAL_ANNOUNCEMENTS) {
    await prisma.announcement.upsert({
      where: { slug: ann.slug },
      update: {},
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

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
