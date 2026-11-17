'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  Zap,
  Sparkles,
  Lock,
  ArrowRight,
  Layers,
  Edit3,
} from 'lucide-react';
import { createSamplePdf } from '@/lib/pdf/sample-pdf';

interface PdfDropzoneProps {
  onFileLoaded: (file: File, arrayBuffer: ArrayBuffer) => void;
  isLoading: boolean;
}

export function PdfDropzone({ onFileLoaded, isLoading }: PdfDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        onFileLoaded(file, buffer);
      } else {
        alert('Please drop a valid .pdf file.');
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const buffer = await file.arrayBuffer();
      onFileLoaded(file, buffer);
    }
  };

  const handleLoadSample = async () => {
    const bytes = await createSamplePdf();
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    const file = new File([arrayBuffer], 'Sample-Consulting-Agreement.pdf', {
      type: 'application/pdf',
    });
    onFileLoaded(file, arrayBuffer);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-4 py-12 bg-linear-to-b from-slate-50 via-white to-slate-100">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Hero badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Next-Gen Direct PDF Editor • No Extension Conversion</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight text-center mb-4 leading-tight">
          Edit, Sign & Redact PDFs <br className="hidden sm:inline" />
          <span className="bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Directly in Your Browser
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-600 text-center max-w-2xl mb-10 leading-relaxed">
          Upload any PDF and annotate, draw, sign, add text, whiteout secrets, and reorganize pages instantly. 
          Zero server uploads, 100% private, and perfectly lossless.
        </p>

        {/* Upload Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-2xl rounded-3xl border-2 border-dashed p-8 md:p-12 flex flex-col items-center text-center cursor-pointer transition-all duration-200 relative overflow-hidden group shadow-lg ${
            isDragOver
              ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01] shadow-indigo-100'
              : 'border-slate-300 bg-white hover:border-indigo-400 hover:shadow-xl hover:bg-slate-50/50'
          }`}
        >
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-200/60 transition-colors" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-100/60 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-200/60 transition-colors" />

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5 text-indigo-600 shadow-inner group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-10 h-10" />
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {isLoading ? 'Opening and preparing document...' : 'Drop your PDF here, or browse files'}
          </h3>

          <p className="text-sm text-slate-500 max-w-md mb-6">
            Supports all standard PDF documents. Processed directly in local memory.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-md hover:bg-indigo-700 transition-colors"
            >
              Select PDF File
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSample();
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors flex items-center gap-2 border border-slate-200/80"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Try Sample Agreement</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-10">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Zero Server Uploads</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                100% client-side memory execution ensures absolute privacy and confidentiality.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Direct PDF Binary</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                No converting to Word or images. Edits are injected directly into vector structures.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Full Edit Suite</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign, highlight, draw, redact, add images, and reorganize pages effortlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
