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

  const features = [
    { icon: ShieldCheck, title: 'Truly private', text: 'Everything runs in your browser memory. Nothing is uploaded, ever.', tone: 'from-emerald-500 to-teal-500' },
    { icon: Zap, title: 'Edit the real PDF', text: 'No Word or image conversion. Edits go straight into the vector file.', tone: 'from-blue-600 to-cyan-500' },
    { icon: Edit3, title: 'Click-to-edit text', text: 'Click any line on the page and change it in place.', tone: 'from-blue-500 to-violet-500' },
    { icon: Lock, title: 'Real redaction', text: 'Redacted content is burned out of the file, not just covered.', tone: 'from-rose-500 to-orange-500' },
    { icon: Layers, title: 'Organise pages', text: 'Rotate, reorder, duplicate, delete and insert blank pages.', tone: 'from-sky-500 to-blue-600' },
    { icon: Sparkles, title: 'Sign & annotate', text: 'Draw, type or upload signatures, plus stamps, shapes and highlights.', tone: 'from-fuchsia-500 to-pink-500' },
  ];

  return (
    <div className="px-5 pt-14 pb-20">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: message + upload */}
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Free · No sign-up · Works offline
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-5">
            Edit PDFs <span className="text-gradient">like a document,</span> not a puzzle.
          </h1>

          <p className="text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
            Change text, sign, redact and reorganise pages directly in your browser.
            Your files stay on your device.
          </p>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`relative rounded-3xl p-px cursor-pointer transition-all duration-200 group outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
              isDragOver
                ? 'bg-linear-to-r from-blue-600 to-cyan-500 scale-[1.02] shadow-2xl shadow-blue-500/30'
                : 'bg-linear-to-r from-blue-200 via-white to-cyan-200 hover:from-blue-500 hover:to-cyan-400 shadow-xl shadow-blue-900/5'
            }`}
          >
            <div className="rounded-[calc(1.5rem-1px)] bg-white/95 p-7 md:p-9 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                {isLoading ? (
                  <div className="w-7 h-7 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {isLoading ? 'Opening your document…' : isDragOver ? 'Drop to open' : 'Drop a PDF here or click to browse'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Opens instantly. Nothing is uploaded.</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample();
                }}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors flex items-center gap-2 border border-slate-200"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Try a sample
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: logo hero */}
        <div className="relative hidden lg:flex items-center justify-center" aria-hidden="true">
          <div className="absolute w-96 h-96 rounded-full bg-linear-to-tr from-blue-400/30 to-cyan-300/30 blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="relative w-105 max-w-full animate-float drop-shadow-2xl" />
        </div>
      </div>

      {/* Feature grid */}
      <div className="max-w-6xl mx-auto mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(({ icon: Icon, title, text, tone }, i) => (
          <div
            key={title}
            style={{ animationDelay: `${i * 70}ms` }}
            className="animate-rise p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${tone} text-white flex items-center justify-center mb-3 shadow-md`}>
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">{title}</h4>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
