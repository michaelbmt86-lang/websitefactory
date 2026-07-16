import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import db from "@/lib/db";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

interface SessionData {
  username: string;
  role: string;
  expiresAt: number;
}

const sessions = new Map<string, SessionData>();

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function createSession(
  username: string
): Promise<string> {
  const user = db
    .prepare("SELECT role FROM users WHERE username = ?")
    .get(username) as { role: string } | undefined;

  const role = user?.role ?? "admin";
  const token = crypto.randomUUID();

  sessions.set(token, {
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

  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

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
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    sessions.delete(token);
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
