'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';

interface VideoUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export default function VideoUploader({ onUpload, isUploading = false }: VideoUploaderProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setUploadStatus('uploading');
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 100);

      await onUpload(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload error:', error);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const rootProps = getRootProps();

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {uploadStatus === 'idle' && !isUploading && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`border-4 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onClick={rootProps.onClick}
            onKeyDown={rootProps.onKeyDown}
            onFocus={rootProps.onFocus}
            onBlur={rootProps.onBlur}
            onDrop={rootProps.onDrop}
            onDragEnter={rootProps.onDragEnter}
            onDragLeave={rootProps.onDragLeave}
            onDragOver={rootProps.onDragOver}
            role="presentation"
            tabIndex={0}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className={`mx-auto h-16 w-16 mb-4 transition-colors ${
              isDragActive ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <p className="text-xl font-medium mb-2">
              {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
            </p>
            <p className="text-gray-500">or click to select a file</p>
          </motion.div>
        )}

        {(uploadStatus === 'uploading' || uploadStatus === 'transcribing' || isUploading) && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl bg-white p-8 shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <motion.div
                  className="w-16 h-16 border-4 border-blue-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <h3 className="text-center text-xl font-medium">
                {uploadStatus === 'uploading' || isUploading ? 'Uploading video...' : 'Transcribing...'}
              </h3>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-blue-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-center text-gray-500">{progress}% complete</p>
            </div>
          </motion.div>
        )}

        {uploadStatus === 'success' && !isUploading && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl bg-white p-8 shadow-lg text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
            </motion.div>
            <h3 className="text-xl font-medium mb-2">Success!</h3>
            <p className="text-gray-500">Your video has been uploaded and transcribed</p>
          </motion.div>
        )}

        {uploadStatus === 'error' && !isUploading && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl bg-red-50 p-8 text-center"
          >
            <h3 className="text-xl font-medium text-red-600 mb-2">Upload failed</h3>
            <p className="text-red-500">Please try again</p>
            <button
              onClick={() => setUploadStatus('idle')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 