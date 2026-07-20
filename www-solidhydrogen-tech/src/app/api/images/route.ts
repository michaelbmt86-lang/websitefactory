import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {

  const rows = db.prepare(`
    SELECT *
    FROM images
    ORDER BY id
  `).all();

  return NextResponse.json(rows);

}

export async function POST(req: NextRequest) {

  const body = await req.json();

  db.prepare(`
    UPDATE images
    SET
      path = ?,
      alt = ?
    WHERE id = ?
  `).run(
    body.path,
    body.alt,
    body.id
  );

  return NextResponse.json({
    success: true,
  });

}