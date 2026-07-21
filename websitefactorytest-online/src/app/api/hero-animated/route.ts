import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const row = db.prepare("SELECT * FROM hero_animated LIMIT 1").get();
  return NextResponse.json(row);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  db.prepare("UPDATE hero_animated SET word1 = ?, word2 = ? WHERE id = 1").run(body.word1, body.word2);
  return NextResponse.json({ success: true });
}
