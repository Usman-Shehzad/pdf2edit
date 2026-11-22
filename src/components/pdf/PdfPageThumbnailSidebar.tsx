'use client';

import React from 'react';
import {
  RotateCw,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
} from 'lucide-react';
import type { PageInfo } from '@/types/pdf';

interface PdfPageThumbnailSidebarProps {
  pages: PageInfo[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onRotatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onAddBlankPage: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function PdfPageThumbnailSidebar({
  pages,
  activePageIndex,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  onDuplicatePage,
  onMovePage,
  onAddBlankPage,
  isOpen,
  onToggleOpen,
}: PdfPageThumbnailSidebarProps) {
  if (!isOpen) {
    return (
      <div className="border-r border-slate-200 bg-white p-2 flex flex-col items-center">
        <button
          onClick={onToggleOpen}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Open Page Thumbnails"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50/80 flex flex-col h-full shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Pages ({pages.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddBlankPage}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Add Blank Page"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleOpen}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Close Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {pages.map((page, index) => {
          const isActive = index === activePageIndex;
          const isLandscape = (page.rotation % 180 !== 0 ? page.height : page.width) >
                              (page.rotation % 180 !== 0 ? page.width : page.height);

          return (
            <div
              key={`${page.originalIndex}-${index}`}
              onClick={() => onSelectPage(index)}
              className={`group relative rounded-xl border p-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-100'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  {index + 1}
                </span>

                {/* Quick Page Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovePage(index, index - 1);
                      }}
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                      title="Move Page Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {index < pages.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovePage(index, index + 1);
                      }}
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                      title="Move Page Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotatePage(index);
                    }}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(index);
                    }}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(index);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Page Miniature Placeholder / Preview */}
              <div className="flex justify-center items-center py-2 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                <div
                  className="bg-white border border-slate-300 shadow-2xs flex flex-col justify-between p-2 text-slate-300 transition-transform"
                  style={{
                    width: isLandscape ? 110 : 80,
                    height: isLandscape ? 80 : 110,
                    transform: `rotate(${page.rotation}deg)`,
                  }}
                >
                  <div className="space-y-1">
                    <div className="w-3/4 h-1.5 bg-slate-200 rounded-full" />
                    <div className="w-full h-1 bg-slate-100 rounded-full" />
                    <div className="w-5/6 h-1 bg-slate-100 rounded-full" />
                    <div className="w-2/3 h-1 bg-slate-100 rounded-full" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-4 h-4 bg-slate-100 rounded-xs" />
                    <span className="text-[8px] font-mono font-semibold text-slate-400">
                      p.{index + 1}
                    </span>
                  </div>
                </div>
              </div>

              {page.rotation > 0 && (
                <div className="mt-1 text-[10px] text-slate-400 text-center font-medium">
                  Rotated {page.rotation}°
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
