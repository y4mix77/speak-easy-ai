'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VideoUploader from '@/components/VideoUploader';
import { transcribeUploadedFile, generateBlogPostAction } from '@/actions/upload-actions';
import { toast } from '@/components/ui/use-toast';
import { useUploadThing } from '@/utils/uploadthing';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Square, VideoIcon } from 'lucide-react';

export default function UploadHandler() {
  const [isUploading, setIsUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const { startUpload } = useUploadThing("videoOrAudioUploader");
  const router = useRouter();

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Upload using UploadThing client
      const uploadResponse = await startUpload([file]);

      if (!uploadResponse || uploadResponse.length === 0) {
        throw new Error('Failed to upload file');
      }

      // Store video URL for preview
      setVideoUrl(uploadResponse[0].url);
      setIsVideoOpen(true);

      // Now process the transcription
      const result = await transcribeUploadedFile([{
        serverData: {
          userId: uploadResponse[0].serverData.userId,
          file: {
            url: uploadResponse[0].url,
            name: file.name
          }
        }
      }]);
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to transcribe video');
      }

      toast({
        title: "Success!",
        description: "Your video has been uploaded and transcribed successfully.",
      });

      // Generate the blog post
      const postResult = await generateBlogPostAction({
        transcriptions: result.data.transcriptions,
        userId: result.data.userId,
      });

      // The generateBlogPostAction will handle the redirect to /posts/[postId]

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-3xl mx-auto">
        <VideoUploader onUpload={handleUpload} isUploading={isUploading} />
      </div>

      <AnimatePresence>
        {videoUrl && (
          <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-purple-700 to-indigo-800 p-3 flex items-center justify-between"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 text-white">
                  <VideoIcon className="w-5 h-5" />
                  <span className="font-medium">Video Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors">
                    <Minus className="w-2 h-2 mx-auto text-yellow-800 opacity-0 hover:opacity-100" />
                  </button>
                  <button className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors">
                    <Square className="w-2 h-2 mx-auto text-green-800 opacity-0 hover:opacity-100" />
                  </button>
                  <button 
                    onClick={() => setIsVideoOpen(false)}
                    className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors"
                  >
                    <X className="w-2 h-2 mx-auto text-red-800 opacity-0 hover:opacity-100" />
                  </button>
                </div>
              </motion.div>

              <motion.div 
                className="aspect-video relative bg-black"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-white text-center space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto"></div>
                    <p className="text-lg font-medium">Processing Your Video</p>
                    <p className="text-sm text-gray-300">Transcribing and generating blog post...</p>
                  </div>
                </motion.div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
} 