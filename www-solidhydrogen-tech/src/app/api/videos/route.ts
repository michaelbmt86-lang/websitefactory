import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {

  const rows = db.prepare(`
    SELECT *
    FROM videos
    ORDER BY id
  `).all();

  return NextResponse.json(rows);

}

export async function POST(req: NextRequest) {

  const body = await req.json();

  db.prepare(`
    UPDATE videos
    SET
      path = ?,
      poster = ?
    WHERE id = ?
  `).run(
    body.path,
    body.poster,
    body.id
  );

  return NextResponse.json({
    success: true,
  });

}