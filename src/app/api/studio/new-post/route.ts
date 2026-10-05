import { createPost } from "@/app/actions/studio";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const id = await createPost();
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 401 },
    );
  }
}
