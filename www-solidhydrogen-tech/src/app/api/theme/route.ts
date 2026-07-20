import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const row = db.prepare(`
    SELECT *
    FROM theme
    LIMIT 1
  `).get();

  return NextResponse.json(row);
}

export async function POST(req: Request) {
  const data = await req.json();

  db.prepare(`
    UPDATE theme
    SET
      site_name = ?,
      logo = ?,
      favicon = ?,
      primary_color = ?,
      secondary_color = ?,
      background_color = ?,
      text_color = ?,
      button_color = ?,
      font_family = ?
    WHERE id = 1
  `).run(
    data.site_name,
    data.logo,
    data.favicon,
    data.primary_color,
    data.secondary_color,
    data.background_color,
    data.text_color,
    data.button_color,
    data.font_family
  );

  return NextResponse.json({
    success: true,
  });
}