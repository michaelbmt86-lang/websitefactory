import { NextResponse } from "next/server";
import { getPages, createPage } from "@/lib/site";

export async function GET() {
  try {
    const pages = getPages();
    return NextResponse.json(pages);
  } catch (error) {
    console.error("Failed to fetch pages:", error);
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const page = createPage(body);
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("Failed to create page:", error);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
