'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';

// Dynamically import PdfEditor with ssr: false so PDF.js and Canvas only run in the browser
const PdfEditor = dynamic(
  () => import('@/components/pdf/PdfEditor').then((mod) => mod.PdfEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-semibold text-sm">Initializing secure PDF engine...</p>
      </div>
    ),
  }
);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileLoaded = (loadedFile: File, buffer: ArrayBuffer) => {
    setIsLoading(true);
    setFile(loadedFile);
    setArrayBuffer(buffer);
    setIsLoading(false);
  };

  const handleReset = () => {
    setFile(null);
    setArrayBuffer(null);
  };

  if (file && arrayBuffer) {
    return (
      <PdfEditor
        initialFile={file}
        initialArrayBuffer={arrayBuffer}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PdfDropzone onFileLoaded={handleFileLoaded} isLoading={isLoading} />
    </div>
  );
}
