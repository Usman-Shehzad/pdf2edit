'use client';

import React, { useState } from 'react';
import { ShieldCheck, Info, X, Lock } from 'lucide-react';

export function PdfSecurityBadge() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs"
        title="Click to view security and privacy architecture"
        type="button"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-semibold">100% Client-Side Private</span>
        <Info className="w-3 h-3 text-emerald-500 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-white rounded-xl shadow-xl border border-slate-200 z-50 text-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-start justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Security & Privacy Guarantee</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
            Your document is parsed, edited, and exported <strong>completely inside your browser memory</strong>.
          </p>

          <ul className="text-xs space-y-1.5 mt-2.5 text-slate-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Zero server uploads or database storage</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Protected against remote data intercepts & leaks</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Safe for confidential, legal, and financial files</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Direct binary PDF manipulation with zero rasterization</span>
            </li>
          </ul>

          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
