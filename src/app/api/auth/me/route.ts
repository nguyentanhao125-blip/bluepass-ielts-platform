import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session";
import { getStore } from "@/lib/store";

/**
 * GET /api/auth/me
 * Synchronizes the client's auth state with the server's cryptographically signed HTTP-only cookie.
 * If no valid session cookie exists yet, initializes a default STUDENT session so RBAC is always enforced.
 */
export async function GET(req: NextRequest) {
  const store = getStore();
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const verified = verifySessionToken(token);

  if (verified) {
    const user = store.users.find((u) => u.id === verified.userId);
    if (user) {
      // Ensure cookie role stays in sync if Admin updated the user's role in the database
      if (user.role !== verified.role) {
        const refreshedToken = signSessionToken(user);
        const res = NextResponse.json({ authenticated: true, user });
        res.cookies.set(SESSION_COOKIE_NAME, refreshedToken, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });
        return res;
      }
      return NextResponse.json({ authenticated: true, user });
    }
  }

  // Default fallback: assign default STUDENT session (`user-student-1`)
  const defaultStudent =
    store.users.find((u) => u.id === "user-student-1") ||
    store.users.find((u) => u.role === "STUDENT") ||
    store.users[0];

  const defaultToken = signSessionToken(defaultStudent);
  const res = NextResponse.json({
    authenticated: false,
    user: defaultStudent,
  });

  res.cookies.set(SESSION_COOKIE_NAME, defaultToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return res;
}

/**
 * POST /api/auth/me (Logout / Reset to default Student view)
 */
export async function POST() {
  const store = getStore();
  const defaultStudent =
    store.users.find((u) => u.id === "user-student-1") ||
    store.users.find((u) => u.role === "STUDENT") ||
    store.users[0];

  const defaultToken = signSessionToken(defaultStudent);
  const res = NextResponse.json({
    success: true,
    message: "Đã đăng xuất khỏi phiên quản trị và quay về chế độ Học viên.",
    user: defaultStudent,
  });

  res.cookies.set(SESSION_COOKIE_NAME, defaultToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return res;
}
