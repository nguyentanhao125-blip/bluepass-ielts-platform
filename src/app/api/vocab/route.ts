import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const store = getStore();
  const userId = req.nextUrl.searchParams.get("userId") || "user-student-1";

  const userProgress: Record<string, "NEW" | "LEARNING" | "MASTERED"> = {};
  for (const [key, status] of Object.entries(store.vocabProgress)) {
    if (key.startsWith(`${userId}:`)) {
      const wordId = key.split(":")[1];
      userProgress[wordId] = status;
    }
  }

  return NextResponse.json({
    decks: store.vocabDecks,
    progress: userProgress,
  });
}

export async function POST(req: NextRequest) {
  try {
    const store = getStore();
    const body = await req.json();
    const {
      userId = "user-student-1",
      wordId,
      status,
    }: {
      userId?: string;
      wordId: string;
      status: "NEW" | "LEARNING" | "MASTERED";
    } = body;

    if (!wordId || !status) {
      return NextResponse.json(
        { error: "Thiếu thông tin từ vựng cần cập nhật." },
        { status: 400 }
      );
    }

    store.vocabProgress[`${userId}:${wordId}`] = status;

    return NextResponse.json({
      success: true,
      wordId,
      status,
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi cập nhật tiến độ từ vựng." },
      { status: 500 }
    );
  }
}
