import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const row = db.prepare("SELECT * FROM footer_details LIMIT 1").get();
  return NextResponse.json(row);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  db.prepare(`
    UPDATE footer_details SET
      location_name = ?, address_line1 = ?, address_line2 = ?
    WHERE id = 1
  `).run(body.location_name, body.address_line1, body.address_line2);
  return NextResponse.json({ success: true });
}
