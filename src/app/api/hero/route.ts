import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const hero = db
    .prepare("SELECT * FROM hero LIMIT 1")
    .get();

  return NextResponse.json(hero);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  db.prepare(`
    UPDATE hero
    SET
      title1 = ?,
      title2 = ?,
      title3 = ?,
      video = ?,
      poster = ?
    WHERE id = 1
  `).run(
    body.title1,
    body.title2,
    body.title3,
    body.video,
    body.poster
  );

  return NextResponse.json({
    success: true
  });
}