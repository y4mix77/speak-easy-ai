"use client";

import { useCallback, useState } from "react";
import BgGradient from "../common/bg-gradient";
import { ForwardRefEditor } from "./forward-ref-editor";
import { useFormState, useFormStatus } from "react-dom";
import { updatePostAction } from "@/actions/edit-actions";
import { Button } from "../ui/button";
import { Download, Edit2, Loader2, VideoIcon, Save, Clock, FileText, X, Minus, Square, Heart, Share2, MapPin, School, Brain, Sun, Moon, Sparkles, Timer, Cpu, Zap } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className={`w-40 bg-gradient-to-r from-purple-900 to-indigo-600 hover:from-purple-600 hover:to-indigo-900 text-white font-semibold py-2 px-4 rounded-full shadow-lg transform transition duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2`}
      disabled={pending}
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Updating...
        </span>
      ) : (
        <span className="flex items-center justify-center">
          <Edit2 className="w-5 h-5 mr-2" />
          Update Text
        </span>
      )}
    </Button>
  );
}

const initialState = {
  success: false,
};

type UploadState = {
  success: boolean;
};

type UploadAction = (
  state: UploadState,
  formData: FormData
) => Promise<UploadState>;

export default function ContentEditor({
  posts,
}: {
  posts: Array<{ content: string; title: string; id: string; video_url?: string | null }>;
}) {
  const [content, setContent] = useState(posts[0].content);
  const [isChanged, setIsChanged] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);

  const videoUrl = posts[0]?.video_url;
  console.log('Video URL in ContentEditor:', videoUrl);

  const updatedPostActionWithId = updatePostAction.bind(null, {
    postId: posts[0].id,
    content,
  });

  const [state, formAction] = useFormState<UploadState, FormData>(
    updatedPostActionWithId as unknown as UploadAction,
    initialState
  );

  const handleContentChange = (value: string) => {
    setContent(value);
    setIsChanged(true);
  };

  const handleExport = useCallback(() => {
    const filename = `${posts[0].title || "blog-post"}.md`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [content, posts]);

  const toggleAi = () => {
    setIsAiActive(prev => !prev);
  };

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              📝 Edit your post
            </h2>
            <p className="text-gray-600">Start editing your blog post below...</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setIsVideoOpen(true)}
              className="w-40 bg-gradient-to-r from-blue-500 to-blue-900 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transform transition duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <VideoIcon className="w-5 h-5 mr-2" />
              View Video
            </Button>
            <SubmitButton />
            <Button
              onClick={handleExport}
              className="w-40 bg-gradient-to-r from-amber-500 to-amber-900 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transform transition duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
            >
              <Download className="w-5 h-5 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <BgGradient className="opacity-20">
          <ForwardRefEditor
            markdown={posts[0].content}
            className="markdown-content border-dotted border-gray-200 border-2 p-4 rounded-md animate-in ease-in-out duration-75 min-h-[400px]"
            onChange={handleContentChange}
          />
        </BgGradient>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Last edited just now</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{content.split(' ').length} words</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-green-600" />
                  <span>~{Math.ceil(content.split(' ').length / 200)} min read</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700">AI Enhanced</span>
                  <Sparkles className="w-3 h-3 text-blue-600" />
                </motion.div>
                <motion.button 
                  className={`relative p-2 rounded-full transition-colors ${isAiActive ? 'bg-purple-100' : 'hover:bg-gray-100'}`}
                  onClick={toggleAi}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-20"
                    animate={{
                      scale: isAiActive ? [1, 1.2, 1] : 1,
                      opacity: isAiActive ? [0.2, 0.3, 0.2] : 0.2
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <div className="relative flex items-center justify-center">
                    <Cpu className={`w-5 h-5 ${isAiActive ? 'text-purple-600' : 'text-gray-600'}`} />
                    <motion.div
                      className="absolute"
                      animate={{
                        opacity: isAiActive ? [0, 1, 0] : 0
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Zap className="w-5 h-5 text-blue-500" />
                    </motion.div>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
              <motion.div 
                className="flex items-center space-x-3 text-gray-600"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <School className="w-5 h-5 text-purple-600" />
                <span className="font-medium">ISGA Marrakech</span>
                <a 
                  href="https://www.isga.ma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Visit Website →
                </a>
              </motion.div>
              <motion.div 
                className="mt-3 relative h-48 rounded-lg overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3397.0374371493433!2d-8.006016599999999!3d31.6305557!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xdafee8aee78a575%3A0xec2b40f21e55285a!2sISGA%20Campus%20Marrakech!5e0!3m2!1sen!2sma!4v1650000000000!5m2!1sen!2sma"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                ></iframe>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
              </motion.div>
              <motion.div 
                className="mt-3 flex items-center text-sm text-gray-500"
                initial={{ opacity: 0.8 }}
                whileHover={{ opacity: 1, x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                <span>Rue Ibn Habousse – Hivernage – Marrakech</span>
              </motion.div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-b from-white to-gray-50">
            <motion.div 
              className="flex items-center justify-between text-sm text-gray-500"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex items-center space-x-2">
                <span>Made with</span>
                <motion.span 
                  className="font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-default"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  ChrolloX
                </motion.span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Created by</span>
                <motion.span 
                  className="text-purple-600 font-medium relative"
                  whileHover={{ scale: 1.05 }}
                >
                  Chrollo @ ISGA
                  <motion.div
                    className="absolute -bottom-px h-px w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.span>
                <motion.span 
                  className="text-red-500"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ❤
                </motion.span>
              </div>
            </motion.div>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {isVideoOpen && (
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
                  <span className="font-medium">Original Video</span>
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
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full"
                    onError={(e) => {
                      console.error('Video loading error:', e);
                      toast({
                        title: "Video Error",
                        description: "There was an error loading the video. Please try again.",
                        variant: "destructive",
                      });
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                    <VideoIcon className="w-12 h-12" />
                    <p>No video available for this post</p>
                    <p className="text-sm text-gray-500">Try uploading a new video first</p>
                  </div>
                )}
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
