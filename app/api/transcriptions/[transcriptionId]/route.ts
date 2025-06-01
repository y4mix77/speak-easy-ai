import { NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import getDbConnection from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { transcriptionId: string } }
) {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return new NextResponse("Missing text", { status: 400 });
    }

    const sql = await getDbConnection();
    
    // First verify ownership
    const transcription = await sql`
      SELECT id FROM transcriptions 
      WHERE id = ${params.transcriptionId} 
      AND user_id = ${user.id}
    `;

    if (!transcription?.length) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Update the transcription
    await sql`
      UPDATE transcriptions 
      SET text = ${text}, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${params.transcriptionId}
    `;

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[TRANSCRIPTION_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 