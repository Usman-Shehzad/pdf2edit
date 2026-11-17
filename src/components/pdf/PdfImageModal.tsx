'use client';

import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react';

interface PdfImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImage: (dataUrl: string, width: number, height: number) => void;
}

export function PdfImageModal({ isOpen, onClose, onApplyImage }: PdfImageModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          setDataUrl(result);
          // Scale to reasonable default PDF size (max 200pt wide/tall)
          const maxDim = 180;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = w * ratio;
            h = h * ratio;
          }
          setDimensions({ width: Math.round(w), height: Math.round(h) });
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!dataUrl) return;
    onApplyImage(dataUrl, dimensions.width, dimensions.height);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Insert Image or Stamp</h3>
              <p className="text-xs text-slate-500">Add logos, seals, photos, or diagrams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!dataUrl ? (
            <label className="w-full h-52 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-indigo-50/20 transition-all p-6 text-center group">
              <div className="p-3 bg-white rounded-full shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-slate-800">
                Click to browse or drag image here
              </span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG, SVG, or WEBP supported</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full h-48 relative border border-slate-200 rounded-xl bg-slate-100/50 flex items-center justify-center p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
                />
              </div>
              <div className="flex items-center justify-between w-full text-xs text-slate-500">
                <span>Placement size: {dimensions.width} × {dimensions.height} pt</span>
                <button
                  onClick={() => setDataUrl(null)}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Choose different image
                </button>
              </div>
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
            disabled={!dataUrl}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all"
          >
            <Check className="w-4 h-4" />
            Insert onto Page
          </button>
        </div>
      </div>
    </div>
  );
}
