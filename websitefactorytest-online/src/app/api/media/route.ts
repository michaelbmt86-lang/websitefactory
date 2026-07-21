import { NextResponse } from "next/server";
import { getMedia, createMedia } from "@/lib/site";

export async function GET() {
  try {
    const media = getMedia();
    return NextResponse.json(media);
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const media = createMedia(body);
    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error("Failed to create media:", error);
    return NextResponse.json({ error: "Failed to create media" }, { status: 500 });
  }
}
