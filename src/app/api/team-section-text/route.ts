import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const row = db.prepare("SELECT * FROM team_section_text LIMIT 1").get();
  return NextResponse.json(row);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  db.prepare(`
    UPDATE team_section_text SET
      heading_1 = ?, heading_2 = ?, heading_3 = ?,
      subheading_1 = ?, subheading_2 = ?, subheading_3 = ?
    WHERE id = 1
  `).run(body.heading_1, body.heading_2, body.heading_3, body.subheading_1, body.subheading_2, body.subheading_3);
  return NextResponse.json({ success: true });
}
