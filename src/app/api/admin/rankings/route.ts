import { NextRequest, NextResponse } from "next/server";
import { suggestPlacementClass } from "@/lib/grading";
import { getAuthenticatedUser } from "@/lib/session";
import { getStore, saveStoreToDisk } from "@/lib/store";

function maskEmailForStudent(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const prefix = local.slice(0, Math.min(3, local.length));
  return `${prefix}***@${domain}`;
}

export async function GET(req: NextRequest) {
  const store = getStore();
  const caller = getAuthenticatedUser(req);
  const isStaffOrAdmin =
    caller !== null && (caller.role === "ADMIN" || caller.role === "STAFF");
  const { searchParams } = req.nextUrl;

  const testId = searchParams.get("testId") || "ALL";
  const skill = searchParams.get("skill") || "ALL";
  const onlyPlacement = searchParams.get("onlyPlacement") === "true";
  const search = searchParams.get("q")?.toLowerCase().trim() || "";
  const format = searchParams.get("format");

  // Filter all submitted attempts
  const filtered = store.attempts.filter((a) => {
    if (a.status !== "SUBMITTED") return false;
    if (testId !== "ALL" && a.testId !== testId) return false;
    if (skill !== "ALL" && a.testSkill !== skill) return false;
    if (onlyPlacement && !a.isPlacement) return false;
    if (
      search &&
      !a.userFullName.toLowerCase().includes(search) &&
      !a.userStudentCode.toLowerCase().includes(search) &&
      !a.userEmail.toLowerCase().includes(search) &&
      !a.testTitle.toLowerCase().includes(search)
    ) {
      return false;
    }
    return true;
  });

  // Sort strictly from Highest to Lowest Score:
  // 1. percentageScore DESC (or rawScore DESC)
  // 2. timeSpentSeconds ASC (shortest completion time wins ties)
  // 3. tabSwitchCount ASC (fewest tab switches wins ties)
  const sorted = [...filtered].sort((a, b) => {
    if (b.percentageScore !== a.percentageScore) {
      return b.percentageScore - a.percentageScore;
    }
    if (b.rawScore !== a.rawScore) {
      return b.rawScore - a.rawScore;
    }
    if (a.timeSpentSeconds !== b.timeSpentSeconds) {
      return a.timeSpentSeconds - b.timeSpentSeconds;
    }
    return a.tabSwitchCount - b.tabSwitchCount;
  });

  const rankedRows = sorted.map((item, idx) => ({
    rank: idx + 1,
    attemptId: item.id,
    studentCode: item.userStudentCode,
    fullName: item.userFullName,
    email: isStaffOrAdmin ? item.userEmail : maskEmailForStudent(item.userEmail),
    testId: item.testId,
    testTitle: item.testTitle,
    skill: item.testSkill,
    isPlacement: item.isPlacement,
    rawScore: item.rawScore,
    totalQuestions: item.totalQuestions,
    percentageScore: item.percentageScore,
    bandScore: item.bandScore,
    timeSpentSeconds: item.timeSpentSeconds,
    tabSwitchCount: item.tabSwitchCount,
    suggestedClass: suggestPlacementClass(item.percentageScore),
    antiCheatFlag:
      item.tabSwitchCount >= 4
        ? "NGHI VẤN CAO (>=4 lần chuyển tab)"
        : item.tabSwitchCount > 0
        ? `Chuyển tab ${item.tabSwitchCount} lần`
        : "Hợp lệ (0 lần)",
    submittedAt: item.submittedAt || item.startedAt,
  }));

  // ===========================================================================
  // EXCEL / CSV EXPORT MODE (?format=csv)
  // Full unmasked emails & anti-cheat logs for ADMIN/STAFF; masked emails for STUDENT
  // Includes UTF-8 BOM (\uFEFF) so Microsoft Excel opens Vietnamese characters cleanly
  // ===========================================================================
  if (format === "csv") {
    const headers = [
      "Hạng",
      "Mã Học Viên",
      "Họ và Tên",
      "Email",
      "Bài Thi",
      "Kỹ Năng",
      "Điểm Thô",
      "Tổng Câu",
      "Tỷ Lệ Đúng (%)",
      "Band IELTS Quy Đổi",
      "Thời Gian Làm Bài (Giây)",
      "Số Lần Chuyển Tab (Anti-Cheat)",
      "Đánh Giá Giám Sát",
      "Lớp Đề Xuất (Tham Khảo)",
      "Thời Gian Nộp Bài",
    ];

    const escapeCsv = (val: unknown) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [
      headers.map(escapeCsv).join(","),
      ...rankedRows.map((r) =>
        [
          r.rank,
          r.studentCode,
          r.fullName,
          r.email,
          r.testTitle,
          r.skill,
          r.rawScore,
          r.totalQuestions,
          `${r.percentageScore}%`,
          r.bandScore.toFixed(1),
          r.timeSpentSeconds,
          r.tabSwitchCount,
          r.antiCheatFlag,
          r.suggestedClass,
          new Date(r.submittedAt).toLocaleString("vi-VN"),
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const csvContent = "\uFEFF" + csvLines.join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Bang_Xep_Hang_Ket_Qua_Thi_${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    totalSubmissions: rankedRows.length,
    rankings: rankedRows,
    availableTests: store.tests.map((t) => ({
      id: t.id,
      title: t.title,
      isPlacement: t.isPlacement,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const caller = getAuthenticatedUser(req);
  if (!caller || caller.role !== "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Truy cập bị từ chối (403 Forbidden): Chỉ Quản trị viên tối cao (ADMIN) mới có quyền xóa kết quả thi.",
      },
      { status: 403 }
    );
  }

  const attemptId = req.nextUrl.searchParams.get("attemptId");
  if (!attemptId) {
    return NextResponse.json(
      { error: "Thiếu mã ID lượt thi cần xóa." },
      { status: 400 }
    );
  }

  const store = getStore();
  const target = store.attempts.find((a) => a.id === attemptId);
  if (!target) {
    return NextResponse.json(
      { error: "Không tìm thấy lượt thi cần xóa." },
      { status: 404 }
    );
  }

  store.attempts = store.attempts.filter((a) => a.id !== attemptId);
  saveStoreToDisk(store);

  return NextResponse.json({
    success: true,
    message: `Đã xóa lượt thi của học viên "${target.userFullName}" (${target.testTitle}) khỏi bảng xếp hạng!`,
  });
}
