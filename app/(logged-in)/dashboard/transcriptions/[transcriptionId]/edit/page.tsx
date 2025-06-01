import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import getDbConnection from "@/lib/db";
import BgGradient from "@/components/common/bg-gradient";
import TranscriptionEditor from "@/components/transcriptions/TranscriptionEditor";

export default async function TranscriptionEditorPage({
  params,
}: {
  params: { transcriptionId: string };
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const sql = await getDbConnection();
  const transcription = await sql`
    SELECT id, text, file_url 
    FROM transcriptions 
    WHERE id = ${params.transcriptionId} 
    AND user_id = ${user.id}
  `;

  if (!transcription?.length) {
    redirect("/dashboard");
  }

  return (
    <BgGradient>
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Edit Transcription
          </h1>
          
          <div className="w-full max-w-4xl">
            <TranscriptionEditor 
              transcriptionId={transcription[0].id} 
              initialText={transcription[0].text} 
              videoUrl={transcription[0].file_url}
            />
          </div>
        </div>
      </div>
    </BgGradient>
  );
} 