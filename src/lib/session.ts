import crypto from "crypto";
import { NextRequest } from "next/server";
import { Role, UserProfile } from "./types";
import { getStore } from "./store";

const SECRET =
  process.env.NEXTAUTH_SECRET ||
  "bluepass_super_secret_jwt_signing_key_2026_vps_production";

export const SESSION_COOKIE_NAME = "bluepass_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  studentCode: string;
  exp: number;
}

export function signSessionToken(user: UserProfile): string {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    studentCode: user.studentCode,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");

  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8")
    ) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the current user from the request's HTTP-only session cookie.
 * ADMIN and STAFF privileges strictly require a valid cryptographically signed cookie.
 */
export function getAuthenticatedUser(req: NextRequest): UserProfile | null {
  const store = getStore();
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const verified = verifySessionToken(token);

  if (verified) {
    const found = store.users.find((u) => u.id === verified.userId);
    if (found) return found;
  }

  // Fallback check via header ONLY for non-privileged STUDENT demo sessions
  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId) {
    const found = store.users.find((u) => u.id === headerUserId);
    if (found && found.role === "STUDENT") return found;
  }

  return null;
}
