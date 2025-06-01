'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoIcon } from 'lucide-react';

interface TranscriptionEditorProps {
  transcriptionId: number;
  initialText: string;
  videoUrl: string;
}

export default function TranscriptionEditor({ transcriptionId, initialText, videoUrl }: TranscriptionEditorProps) {
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(true);
  const router = useRouter();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/transcriptions/${transcriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to save transcription');
      }

      toast({
        title: "Success!",
        description: "Your transcription has been saved.",
      });

      // No redirect - stay on current page
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save transcription",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label htmlFor="transcription" className="text-sm font-medium text-gray-700">
            Edit Transcription
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVideoOpen(true)}
            className="flex items-center gap-2"
          >
            <VideoIcon className="w-4 h-4" />
            View Original Video
          </Button>
        </div>

        <Textarea
          id="transcription"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          className="min-h-[400px] font-mono text-sm"
          placeholder="Your transcription text..."
        />

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save & Generate Blog Post'}
          </Button>
        </div>
      </div>

      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Original Video</DialogTitle>
          </DialogHeader>
          <div className="aspect-video relative">
            <video
              src={videoUrl}
              controls
              className="w-full h-full rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 