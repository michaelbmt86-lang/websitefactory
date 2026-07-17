// ============================================================================
// MIDDLEWARE (Website Factory Framework)
//
// Patterns:
//   - Protects /dashboard and /dashboard/* routes
//   - Validates token format (must have exactly one "." separator)
//   - Forged/invalid tokens redirect to /login with ?from= return path
//   - Does NOT verify HMAC signature (that's done in auth.ts server-side)
//   - Lightweight check: rejects obviously bad tokens before they hit the DB
// ============================================================================

import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "session_token";

const protectedPaths = ["/dashboard"];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token || token.trim() === "") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
