// ============================================================================
// AUTH MODULE (Website Factory Framework)
//
// Patterns:
//   - HMAC-SHA256 signed tokens (not just base64 — prevents forgery)
//   - Token format: base64url(payload).base64url(hmac_signature)
//   - SESSION_SECRET env var required in production (falls back to dev default)
//   - Cookies: httpOnly, secure (in prod), sameSite: lax, path: /
//   - requireAuth() redirects to /login for server components
//   - getCurrentUser() returns null (not redirect) for conditional rendering
//   - Admin UPSERT in db.ts syncs password from ADMIN_PASSWORD env var
// ============================================================================

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import db from "@/lib/db";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const SECRET = process.env.SESSION_SECRET || "change-me-in-production";

interface SessionData {
  username: string;
  role: string;
  expiresAt: number;
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function encodeSession(data: SessionData): string {
  const json = JSON.stringify(data);
  const base64 = Buffer.from(json).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(base64).digest("base64url");
  return `${base64}.${signature}`;
}

function decodeSession(token: string): SessionData | null {
  try {
    const [base64, signature] = token.split(".");
    if (!base64 || !signature) return null;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(base64).digest("base64url");
    if (signature !== expectedSig) return null;
    const json = Buffer.from(base64, "base64url").toString("utf-8");
    const data = JSON.parse(json) as SessionData;
    if (Date.now() > data.expiresAt) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createSession(username: string): Promise<string> {
  const user = db
    .prepare("SELECT role FROM users WHERE username = ?")
    .get(username) as { role: string } | undefined;

  const role = user?.role ?? "admin";
  const token = encodeSession({
    username,
    role,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?").run(username);

  return token;
}

export async function getCurrentUser(): Promise<{ username: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = decodeSession(token);
  if (!session) return null;

  return { username: session.username, role: session.role };
}

export async function requireAuth(): Promise<{ username: string; role: string }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
