import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { getStore, saveStoreToDisk } from "@/lib/store";
import { Role } from "@/lib/types";

/**
 * GET /api/admin/users
 * Returns all users in the system with their roles, student codes, and test attempt counts.
 * Restricted to ADMIN and STAFF (with write operations restricted strictly to ADMIN).
 */
export async function GET(req: NextRequest) {
  const caller = getAuthenticatedUser(req);
  if (!caller || (caller.role !== "ADMIN" && caller.role !== "STAFF")) {
    return NextResponse.json(
      {
        error:
          "Từ chối truy cập (403 Forbidden): Chỉ Quản trị viên (ADMIN) hoặc Tư vấn viên (STAFF) mới được xem danh sách tài khoản.",
      },
      { status: 403 }
    );
  }

  const store = getStore();
  const usersWithStats = store.users.map((u) => {
    const attemptCount = store.attempts.filter(
      (a) => a.userId === u.id && a.status === "SUBMITTED"
    ).length;
    return {
      ...u,
      attemptCount,
    };
  });

  return NextResponse.json({
    users: usersWithStats,
  });
}

/**
 * PATCH /api/admin/users
 * Allows ONLY an authenticated ADMIN to update a user's RBAC Role (STUDENT | STAFF | ADMIN).
 */
export async function PATCH(req: NextRequest) {
  const caller = getAuthenticatedUser(req);
  if (!caller || caller.role !== "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Từ chối truy cập (403 Forbidden): Chỉ Quản trị viên tối cao (ADMIN) mới được phép thay đổi phân quyền tài khoản.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { userId, role }: { userId?: string; role?: Role } = body;

  if (!userId || !role || !["STUDENT", "STAFF", "ADMIN"].includes(role)) {
    return NextResponse.json(
      { error: "Thông tin tài khoản hoặc vai trò (Role) không hợp lệ." },
      { status: 400 }
    );
  }

  const store = getStore();
  const target = store.users.find((u) => u.id === userId);
  if (!target) {
    return NextResponse.json(
      { error: "Không tìm thấy tài khoản người dùng." },
      { status: 404 }
    );
  }

  // Protect primary root Admin account from accidental demotion
  if (
    target.email.toLowerCase() === "admin@bluepass.edu.vn" &&
    role !== "ADMIN"
  ) {
    return NextResponse.json(
      {
        error:
          "Không thể hạ quyền tài khoản Chủ Hệ Thống gốc (admin@bluepass.edu.vn).",
      },
      { status: 400 }
    );
  }

  target.role = role;
  saveStoreToDisk(store);

  return NextResponse.json({
    success: true,
    message: `Đã cập nhật phân quyền của "${target.fullName}" (${target.email}) thành [${role}]!`,
    user: target,
  });
}

/**
 * DELETE /api/admin/users?id=...
 * Allows ONLY an authenticated ADMIN to delete a user account.
 */
export async function DELETE(req: NextRequest) {
  const caller = getAuthenticatedUser(req);
  if (!caller || caller.role !== "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Từ chối truy cập (403 Forbidden): Chỉ Quản trị viên tối cao (ADMIN) mới được phép xóa tài khoản.",
      },
      { status: 403 }
    );
  }

  const userId = req.nextUrl.searchParams.get("id");
  if (!userId) {
    return NextResponse.json(
      { error: "Thiếu mã ID tài khoản cần xóa." },
      { status: 400 }
    );
  }

  const store = getStore();
  const target = store.users.find((u) => u.id === userId);
  if (!target) {
    return NextResponse.json(
      { error: "Không tìm thấy tài khoản cần xóa." },
      { status: 404 }
    );
  }

  if (
    target.email.toLowerCase() === "admin@bluepass.edu.vn" ||
    target.id === "user-student-1"
  ) {
    return NextResponse.json(
      {
        error:
          "Không thể xóa tài khoản Chủ Hệ Thống gốc hoặc tài khoản Học viên mặc định.",
      },
      { status: 400 }
    );
  }

  store.users = store.users.filter((u) => u.id !== userId);
  saveStoreToDisk(store);

  return NextResponse.json({
    success: true,
    message: `Đã xóa tài khoản "${target.fullName}" (${target.email}) khỏi hệ thống.`,
  });
}
