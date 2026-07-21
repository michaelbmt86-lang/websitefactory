import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const footer = db
    .prepare(`
      SELECT *
      FROM footer
      LIMIT 1
    `)
    .get();

  return NextResponse.json(footer);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  db.prepare(`
    UPDATE footer
    SET
      address = ?,
      copyright = ?,
      email = ?,
      description = ?,
      contact_button_label = ?
    WHERE id = 1
  `).run(
    body.address,
    body.copyright,
    body.email,
    body.description,
    body.contact_button_label ?? "Contact Us"
  );

  return NextResponse.json({
    success: true,
  });
}