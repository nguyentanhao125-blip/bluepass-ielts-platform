import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { syncStateToPrismaClient } from "../src/lib/pg-sync";
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ATTEMPTS,
  INITIAL_CHAT_THREADS,
  INITIAL_TESTS,
  INITIAL_USERS,
  INITIAL_VOCAB_DECKS,
} from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding BluePass English Objective Testing Platform into PostgreSQL (pgAdmin 4)...");

  const cachePath = path.join(process.cwd(), ".data-cache.json");
  let users = INITIAL_USERS;
  let tests = INITIAL_TESTS;
  let attempts = INITIAL_ATTEMPTS;
  let announcements = INITIAL_ANNOUNCEMENTS;
  let vocabDecks = INITIAL_VOCAB_DECKS;
  let chatThreads = INITIAL_CHAT_THREADS;
  let passwordHashes: Record<string, string> = {
    "hocvien@bluepass.edu.vn": "123456",
    "tuvan@bluepass.edu.vn": "123456",
    "admin@bluepass.edu.vn": "123456",
  };
  let vocabProgress: Record<string, "NEW" | "LEARNING" | "MASTERED"> = {
    "user-student-1:vw-1": "MASTERED",
    "user-student-1:vw-2": "MASTERED",
    "user-student-1:vw-3": "LEARNING",
    "user-student-1:vw-9": "MASTERED",
  };

  if (fs.existsSync(cachePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      if (Array.isArray(parsed.users) && parsed.users.length > 0) users = parsed.users;
      if (Array.isArray(parsed.tests) && parsed.tests.length > 0) tests = parsed.tests;
      if (Array.isArray(parsed.attempts) && parsed.attempts.length > 0) attempts = parsed.attempts;
      if (Array.isArray(parsed.announcements) && parsed.announcements.length > 0)
        announcements = parsed.announcements;
      if (Array.isArray(parsed.vocabDecks) && parsed.vocabDecks.length > 0)
        vocabDecks = parsed.vocabDecks;
      if (Array.isArray(parsed.chatThreads) && parsed.chatThreads.length > 0)
        chatThreads = parsed.chatThreads;
      if (parsed.passwordHashes) passwordHashes = parsed.passwordHashes;
      if (parsed.vocabProgress) vocabProgress = parsed.vocabProgress;
    } catch {
      // Fallback to INITIAL_* seed data
    }
  }

  const stats = await syncStateToPrismaClient(prisma, {
    users,
    passwordHashes,
    tests,
    attempts,
    announcements,
    vocabDecks,
    vocabProgress,
    chatThreads,
  });

  console.log(`  ✔ Synced ${stats.users} Users (Admin, Staff & Students)`);
  console.log(
    `  ✔ Synced ${stats.tests} Tests, ${stats.parts} TestParts, ${stats.groups} QuestionGroups, ${stats.questions} Questions`
  );
  console.log(`  ✔ Synced ${stats.attempts} TestAttempts (Student Exam Rankings)`);
  console.log(`  ✔ Synced ${stats.vocabDecks} VocabDecks and ${stats.vocabWords} VocabWords`);
  console.log(`  ✔ Synced ${stats.announcements} Announcements`);
  console.log(`  ✔ Synced ${stats.chatThreads} ChatThreads and ${stats.chatMessages} ChatMessages`);
  console.log("✅ PostgreSQL Database seeded 100% successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
