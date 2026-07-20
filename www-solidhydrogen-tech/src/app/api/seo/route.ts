import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {

  const row = db.prepare(`
    SELECT *
    FROM seo
    LIMIT 1
  `).get();

  return NextResponse.json(row);

}

export async function POST(req: Request) {

  const body = await req.json();

  db.prepare(`
    UPDATE seo
    SET
      title = ?,
      description = ?,
      keywords = ?,
      og_image = ?,
      canonical = ?,
      robots = ?
    WHERE id = 1
  `).run(

    body.title,
    body.description,
    body.keywords,
    body.og_image,
    body.canonical,
    body.robots

  );

  return NextResponse.json({
    success: true,
  });

}