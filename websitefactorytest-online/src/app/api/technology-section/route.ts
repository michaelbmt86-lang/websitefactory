import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const row = db.prepare("SELECT * FROM technology_section LIMIT 1").get();
  return NextResponse.json(row);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  db.prepare(`
    UPDATE technology_section SET
      heading = ?, paragraph1_label = ?, paragraph1_body = ?,
      paragraph2_label = ?, paragraph2_body = ?,
      benefits_heading = ?, benefits_subheading = ?,
      cta_prefix = ?, cta_suffix = ?, cta_email = ?, cta_label = ?
    WHERE id = 1
  `).run(
    body.heading, body.paragraph1_label, body.paragraph1_body,
    body.paragraph2_label, body.paragraph2_body,
    body.benefits_heading, body.benefits_subheading,
    body.cta_prefix, body.cta_suffix, body.cta_email, body.cta_label
  );
  return NextResponse.json({ success: true });
}
