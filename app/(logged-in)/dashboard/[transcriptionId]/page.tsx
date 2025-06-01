import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import getDbConnection from "@/lib/db";
import BgGradient from "@/components/common/bg-gradient";

export default async function TranscriptionPage({
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
    SELECT * FROM transcriptions 
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
            Your Transcription
          </h1>
          
          <div className="w-full max-w-3xl bg-white shadow-sm rounded-lg p-6">
            <pre className="whitespace-pre-wrap text-gray-700">
              {transcription[0].text}
            </pre>
          </div>
        </div>
      </div>
    </BgGradient>
  );
} 