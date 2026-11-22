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
    <div className="min-h-screen flex flex-col bg-aurora">
      <header className="glass sticky top-0 z-20 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PDF2Edit logo" className="w-10 h-10 object-contain drop-shadow" />
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              PDF<span className="text-gradient">2Edit</span>
            </span>
          </a>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            Files never leave your device
          </div>
        </div>
      </header>

      <main className="flex-1">
        <PdfDropzone onFileLoaded={handleFileLoaded} isLoading={isLoading} />
      </main>

      <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-500">
        PDF2Edit · Private, in-browser PDF editing · No uploads, no tracking
      </footer>
    </div>
  );
}
