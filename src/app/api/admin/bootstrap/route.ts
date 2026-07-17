import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, secret } = body as {
      username?: string;
      password?: string;
      secret?: string;
    };

    const bootstrapSecret = process.env.BOOTSTRAP_SECRET || "bootstrap-secret-change-me";
    if (secret !== bootstrapSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminUsername = username || process.env.ADMIN_USERNAME || "admin";
    const adminPassword = password || process.env.ADMIN_PASSWORD || "Admin123!";
    const hash = crypto.createHash("sha256").update(adminPassword).digest("hex");

    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(adminUsername) as { id: number } | undefined;

    if (existing) {
      db.prepare("UPDATE users SET password_hash = ?, email = ?, role = ? WHERE username = ?").run(
        hash, "admin@websitefactory.local", "admin", adminUsername
      );
    } else {
      db.prepare("INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)").run(
        adminUsername, hash, "admin@websitefactory.local", "admin"
      );
    }

    return NextResponse.json({
      success: true,
      message: `Admin user "${adminUsername}" bootstrapped successfully`,
    });
  } catch (err) {
    console.error("[bootstrap] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Bootstrap endpoint ready. Send POST with { username, password, secret }.",
  });
}
