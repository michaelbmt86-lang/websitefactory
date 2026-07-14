import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = db.prepare(`
    SELECT *
    FROM team_members
    ORDER BY id
  `).all();

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const team = await req.json();

  const stmt = db.prepare(`
    UPDATE team_members
    SET
      name = ?,
      position = ?,
      bio = ?,
      image = ?
    WHERE id = ?
  `);

  const transaction = db.transaction((members: any[]) => {
    for (const member of members) {
      stmt.run(
        member.name,
        member.position,
        member.bio,
        member.image,
        member.id
      );
    }
  });

  transaction(team);

  return NextResponse.json({
    success: true,
  });
}