import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = db.prepare(`
    SELECT *
    FROM benefits
    ORDER BY id
  `).all();

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {

  const body = await req.json();

  const update = db.prepare(`
    UPDATE benefits
    SET
      icon = ?,
      title = ?
    WHERE id = ?
  `);

  for (const item of body) {

    update.run(
      item.icon,
      item.title,
      item.id
    );

  }

  return NextResponse.json({
    success: true
  });

}