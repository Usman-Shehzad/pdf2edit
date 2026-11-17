'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, PenTool, Type, Upload, RotateCcw, Check } from 'lucide-react';

interface PdfSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySignature: (dataUrl: string) => void;
}

export function PdfSignatureModal({
  isOpen,
  onClose,
  onApplySignature,
}: PdfSignatureModalProps) {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const [signatureColor, setSignatureColor] = useState('#0f172a');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isOpen && tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear on open
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    lastPoint.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = signatureColor;
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = signatureColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPoint.current = { x: currentX, y: currentY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Convert Typed signature to transparent PNG
  const generateTypedSignatureImage = (): string | null => {
    if (!typedName.trim()) return null;
    const offscreen = document.createElement('canvas');
    offscreen.width = 600;
    offscreen.height = 200;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.font = `italic 64px ${selectedFont}`;
    ctx.fillStyle = signatureColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, offscreen.width / 2, offscreen.height / 2);

    return offscreen.toDataURL('image/png');
  };

  const handleApply = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL('image/png');
      onApplySignature(dataUrl);
    } else if (tab === 'type') {
      const dataUrl = generateTypedSignatureImage();
      if (!dataUrl) return;
      onApplySignature(dataUrl);
    } else if (tab === 'upload') {
      if (!uploadedImage) return;
      onApplySignature(uploadedImage);
    }
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setUploadedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create Signature</h3>
            <p className="text-xs text-slate-500">Sign directly or generate a digital signature</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 px-6 pt-3 bg-slate-50/50 gap-2">
          <button
            onClick={() => setTab('draw')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              tab === 'draw'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Draw
          </button>
          <button
            onClick={() => setTab('type')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              tab === 'type'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-4 h-4" />
            Type
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              tab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          {/* Color Chooser */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Ink Color
            </span>
            <div className="flex items-center gap-2">
              {[
                { label: 'Black', color: '#0f172a' },
                { label: 'Navy Blue', color: '#1e3a8a' },
                { label: 'Dark Red', color: '#991b1b' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setSignatureColor(c.color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    signatureColor === c.color ? 'scale-110 border-indigo-600 ring-2 ring-indigo-200' : 'border-white'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* TAB 1: DRAW */}
          {tab === 'draw' && (
            <div className="flex flex-col">
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/70 overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={190}
                  className="w-full h-48 block touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm">
                    Draw your signature here with mouse or stylus
                  </div>
                )}
                {hasDrawn && (
                  <button
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white/90 hover:bg-white rounded-lg shadow-xs border border-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TYPE */}
          {tab === 'type' && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name..."
                className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { id: 'cursive', name: 'Elegant Script', font: 'cursive' },
                  { id: 'sans-serif', name: 'Modern Clean', font: 'sans-serif' },
                  { id: 'serif', name: 'Classic Serif', font: 'serif' },
                  { id: 'monospace', name: 'Monospace Official', font: 'monospace' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFont(f.font)}
                    className={`p-3 text-center rounded-xl border transition-all text-sm truncate ${
                      selectedFont === f.font
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                    style={{ fontFamily: f.font }}
                  >
                    {typedName || f.name}
                  </button>
                ))}
              </div>

              {typedName && (
                <div className="h-24 border border-slate-200 rounded-xl bg-slate-50/70 flex items-center justify-center p-2">
                  <span
                    className="text-3xl italic"
                    style={{ fontFamily: selectedFont, color: signatureColor }}
                  >
                    {typedName}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UPLOAD */}
          {tab === 'upload' && (
            <div className="flex flex-col items-center">
              {!uploadedImage ? (
                <label className="w-full h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors p-4 text-center">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-700">Click to upload signature image</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG, or WEBP (transparent recommended)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              ) : (
                <div className="w-full h-48 relative border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Uploaded signature"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium text-red-600 bg-white/90 hover:bg-white rounded-lg shadow-xs border border-red-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={
              (tab === 'draw' && !hasDrawn) ||
              (tab === 'type' && !typedName.trim()) ||
              (tab === 'upload' && !uploadedImage)
            }
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all"
          >
            <Check className="w-4 h-4" />
            Place Signature
          </button>
        </div>
      </div>
    </div>
  );
}
