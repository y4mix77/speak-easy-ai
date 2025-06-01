'use client';

import { useState } from 'react';
import VideoUploader from '@/components/VideoUploader';
import { transcribeUploadedFile } from '@/actions/upload-actions';

export default function DashboardUploader({ userId }: { userId: string }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      
      // Create FormData and append file
      const formData = new FormData();
      formData.append('files', file);
      
      // Upload the file
      const response = await fetch('/api/uploadthing', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Process the uploaded file
      await transcribeUploadedFile(data);
      
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return <VideoUploader onUpload={handleUpload} />;
} 