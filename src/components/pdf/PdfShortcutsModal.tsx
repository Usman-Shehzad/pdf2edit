'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface PdfShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PdfShortcutsModal({ isOpen, onClose }: PdfShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'V / Esc', desc: 'Select / Pointer mode' },
    { key: 'E', desc: 'Direct edit existing PDF text' },
    { key: 'T', desc: 'Add new text annotation' },
    { key: 'P', desc: 'Pen / Freehand drawing' },
    { key: 'H', desc: 'Highlighter tool' },
    { key: 'R', desc: 'Rectangle tool' },
    { key: 'C', desc: 'Circle / Ellipse tool' },
    { key: 'X', desc: 'Redact / Whiteout tool' },
    { key: 'S', desc: 'Add Signature' },
    { key: 'Delete / Backspace', desc: 'Delete selected annotation' },
    { key: 'Ctrl / ⌘ + Z', desc: 'Undo last change' },
    { key: 'Ctrl / ⌘ + Y', desc: 'Redo change' },
    { key: 'Ctrl / ⌘ + +', desc: 'Zoom in' },
    { key: 'Ctrl / ⌘ + -', desc: 'Zoom out' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-500">Boost your editing speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-2.5">
            {shortcuts.map((sc) => (
              <div
                key={sc.key}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
              >
                <span className="text-xs text-slate-600">{sc.desc}</span>
                <kbd className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-md shadow-2xs">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
