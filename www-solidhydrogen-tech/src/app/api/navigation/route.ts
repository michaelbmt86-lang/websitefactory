import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = db.prepare(`
    SELECT *
    FROM navigation
    ORDER BY sort_order
  `).all();

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {

  const body = await req.json();

  const update = db.prepare(`
    UPDATE navigation
    SET
      label = ?,
      href = ?
    WHERE id = ?
  `);

  for (const item of body) {

    update.run(
      item.label,
      item.href,
      item.id
    );

  }

  return NextResponse.json({
    success: true
  });

}