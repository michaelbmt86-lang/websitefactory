import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  email: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as UserRow | undefined;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession(user.username);

    return NextResponse.json({
      success: true,
      user: { username: user.username, role: user.role },
      token,
    });
  } catch (err) {
    console.error("[login] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
