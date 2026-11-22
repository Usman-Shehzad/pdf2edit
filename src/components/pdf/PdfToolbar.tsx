'use client';

import React, { useState } from 'react';
import {
  MousePointer,
  Type,
  Edit3,
  Pen,
  Highlighter,
  Square,
  Circle,
  Minus,
  ArrowRight,
  ShieldAlert,
  PenTool,
  Image as ImageIcon,
  Stamp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Download,
  Trash2,
  FolderOpen,
  Keyboard,
  Check,
  ChevronDown,
  Palette,
  Eye,
} from 'lucide-react';
import type { ToolType, ToolSettings, Annotation } from '@/types/pdf';
import { PdfSecurityBadge } from './PdfSecurityBadge';

interface PdfToolbarProps {
  fileName: string;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  toolSettings: ToolSettings;
  onChangeToolSettings: (settings: Partial<ToolSettings>) => void;
  selectedAnnotation: Annotation | null;
  onUpdateSelectedAnnotation: (updates: Partial<Annotation>) => void;
  onDeleteSelectedAnnotation: () => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  isExporting: boolean;
  onResetDocument: () => void;
  onOpenSignatureModal: () => void;
  onOpenImageModal: () => void;
  onOpenShortcutsModal: () => void;
  currentPage: number;
  totalPages: number;
}

const COLOR_PRESETS = [
  '#0f172a', // slate black
  '#dc2626', // red
  '#2563eb', // blue
  '#16a34a', // green
  '#d97706', // amber
  '#9333ea', // purple
  '#ffffff', // white
];

const HIGHLIGHTER_PRESETS = [
  '#facc15', // bright yellow
  '#4ade80', // bright green
  '#38bdf8', // sky blue
  '#f472b6', // pink
  '#fb923c', // orange
];

export function PdfToolbar({
  fileName,
  activeTool,
  onSelectTool,
  toolSettings,
  onChangeToolSettings,
  selectedAnnotation,
  onUpdateSelectedAnnotation,
  onDeleteSelectedAnnotation,
  scale,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  isExporting,
  onResetDocument,
  onOpenSignatureModal,
  onOpenImageModal,
  onOpenShortcutsModal,
  currentPage,
  totalPages,
}: PdfToolbarProps) {
  const [shapesDropdownOpen, setShapesDropdownOpen] = useState(false);
  const [stampDropdownOpen, setStampDropdownOpen] = useState(false);

  const activeColor =
    selectedAnnotation && 'color' in selectedAnnotation
      ? (selectedAnnotation as any).color
      : selectedAnnotation && 'strokeColor' in selectedAnnotation
      ? (selectedAnnotation as any).strokeColor
      : activeTool === 'highlight'
      ? '#facc15'
      : toolSettings.color;

  const handleColorChange = (newColor: string) => {
    onChangeToolSettings({ color: newColor, strokeColor: newColor } as any);
    if (selectedAnnotation) {
      if ('color' in selectedAnnotation) {
        onUpdateSelectedAnnotation({ color: newColor } as any);
      }
      if ('strokeColor' in selectedAnnotation) {
        onUpdateSelectedAnnotation({ strokeColor: newColor } as any);
      }
    }
  };

  const handleFontSizeChange = (size: number) => {
    onChangeToolSettings({ fontSize: size });
    if (selectedAnnotation && selectedAnnotation.type === 'text') {
      onUpdateSelectedAnnotation({ fontSize: size });
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    onChangeToolSettings({ strokeWidth: width });
    if (selectedAnnotation && ('strokeWidth' in selectedAnnotation)) {
      onUpdateSelectedAnnotation({ strokeWidth: width });
    }
  };

  const handleFillColorChange = (fill: string) => {
    onChangeToolSettings({ fillColor: fill });
    if (selectedAnnotation && ('fillColor' in selectedAnnotation)) {
      onUpdateSelectedAnnotation({ fillColor: fill });
    }
  };

  return (
    <header className="border-b border-slate-200/70 glass sticky top-0 z-30 shadow-sm flex flex-col">
      {/* Top Header Row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 gap-4">
        {/* Left: Brand + File info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PDF2Edit logo" className="w-9 h-9 object-contain drop-shadow-sm" />
            <span className="font-extrabold tracking-tight text-base hidden sm:inline text-slate-900">
              PDF<span className="text-gradient">2Edit</span>
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-slate-800 truncate max-w-44 md:max-w-xs" title={fileName}>
              {fileName}
            </span>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <PdfSecurityBadge />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-slate-700">
            <button
              onClick={onZoomOut}
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
              title="Zoom Out (Ctrl -)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-semibold px-2">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="p-1 hover:bg-white rounded transition-colors text-slate-600"
              title="Zoom In (Ctrl +)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onZoomFit}
              className="p-1 hover:bg-white rounded transition-colors text-slate-600 ml-0.5"
              title="Fit to Page Width"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-slate-700">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1 hover:bg-white rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1 hover:bg-white rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Shortcuts Info */}
          <button
            onClick={onOpenShortcutsModal}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors hidden md:block"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* New Document Button */}
          <button
            onClick={onResetDocument}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Open Another PDF"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          {/* Primary Download CTA */}
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-linear-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            title="Download finalized edited PDF directly"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tool Selector Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-white/50 overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          {/* Select */}
          <button
            onClick={() => onSelectTool('select')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Select & Move (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Select</span>
          </button>

          {/* Edit Existing PDF Text */}
          <button
            onClick={() => onSelectTool('editText')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTool === 'editText'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-100'
            }`}
            title="Direct Edit Existing PDF Text"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500 group-hover:text-white" />
            <span>Edit PDF Text</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 uppercase">
              Direct
            </span>
          </button>

          {/* New Text */}
          <button
            onClick={() => onSelectTool('text')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTool === 'text'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Add New Text (T)"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>

          {/* Draw Pen */}
          <button
            onClick={() => onSelectTool('draw')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTool === 'draw'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Freehand Pen (P)"
          >
            <Pen className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>

          {/* Highlighter */}
          <button
            onClick={() => onSelectTool('highlight')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTool === 'highlight'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Text Highlighter (H)"
          >
            <Highlighter className="w-3.5 h-3.5 text-yellow-600" />
            <span>Highlight</span>
          </button>

          {/* Shapes Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShapesDropdownOpen(!shapesDropdownOpen);
                setStampDropdownOpen(false);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                ['rectangle', 'circle', 'line', 'arrow'].includes(activeTool)
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              {activeTool === 'circle' ? (
                <Circle className="w-3.5 h-3.5" />
              ) : activeTool === 'line' ? (
                <Minus className="w-3.5 h-3.5" />
              ) : activeTool === 'arrow' ? (
                <ArrowRight className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span className="capitalize">{['rectangle', 'circle', 'line', 'arrow'].includes(activeTool) ? activeTool : 'Shapes'}</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {shapesDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 flex flex-col gap-1 w-36">
                {[
                  { tool: 'rectangle' as ToolType, label: 'Rectangle', icon: Square },
                  { tool: 'circle' as ToolType, label: 'Circle / Oval', icon: Circle },
                  { tool: 'line' as ToolType, label: 'Line', icon: Minus },
                  { tool: 'arrow' as ToolType, label: 'Arrow', icon: ArrowRight },
                ].map((s) => (
                  <button
                    key={s.tool}
                    onClick={() => {
                      onSelectTool(s.tool);
                      setShapesDropdownOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${
                      activeTool === s.tool
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <s.icon className="w-3.5 h-3.5" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Redact / Whiteout */}
          <button
            onClick={() => onSelectTool('redact')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTool === 'redact'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Redact / Whiteout sensitive details (X)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 group-hover:text-white" />
            <span>Redact</span>
          </button>

          {/* Signature */}
          <button
            onClick={onOpenSignatureModal}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-200/70 transition-all border border-slate-200 bg-white shadow-2xs"
            title="Add Signature"
          >
            <PenTool className="w-3.5 h-3.5 text-blue-600" />
            <span>Signature</span>
          </button>

          {/* Image */}
          <button
            onClick={onOpenImageModal}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-200/70 transition-all border border-slate-200 bg-white shadow-2xs"
            title="Insert Image / Seal"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Image</span>
          </button>

          {/* Stamps */}
          <div className="relative">
            <button
              onClick={() => {
                setStampDropdownOpen(!stampDropdownOpen);
                setShapesDropdownOpen(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-200/70 transition-all border border-slate-200 bg-white shadow-2xs"
            >
              <Stamp className="w-3.5 h-3.5 text-blue-600" />
              <span>Stamp</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {stampDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 flex flex-col gap-1 w-44">
                {[
                  { type: 'approved', label: 'APPROVED', color: '#16a34a' },
                  { type: 'confidential', label: 'CONFIDENTIAL', color: '#dc2626' },
                  { type: 'urgent', label: 'URGENT', color: '#ea580c' },
                  { type: 'draft', label: 'DRAFT', color: '#64748b' },
                ].map((st) => (
                  <button
                    key={st.type}
                    onClick={() => {
                      onChangeToolSettings({ stampType: st.type as any, color: st.color });
                      onSelectTool('stamp');
                      setStampDropdownOpen(false);
                    }}
                    className="flex items-center justify-between px-2.5 py-1.5 text-xs font-bold rounded-lg text-left hover:bg-slate-100 transition-colors"
                    style={{ color: st.color }}
                  >
                    <span>{st.label}</span>
                    <Stamp className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected element deletion shortcut */}
        {selectedAnnotation && (
          <button
            onClick={onDeleteSelectedAnnotation}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors ml-auto"
            title="Delete Selected Item (Delete)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        )}
      </div>

      {/* Dynamic Sub-Toolbar for Active Tool Properties */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-white border-t border-slate-100 text-xs text-slate-700 overflow-x-auto">
        {/* Color Presets */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600">Color:</span>
          <div className="flex items-center gap-1">
            {(activeTool === 'highlight' ? HIGHLIGHTER_PRESETS : COLOR_PRESETS).map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  activeColor.toLowerCase() === c.toLowerCase()
                    ? 'scale-125 border-blue-600 ring-2 ring-blue-200'
                    : 'border-slate-300 hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            {/* Custom Color Input */}
            <input
              type="color"
              value={activeColor.startsWith('#') ? activeColor : '#0f172a'}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0 ml-1"
              title="Custom Hex Color"
            />
          </div>
        </div>

        {/* Text specific controls */}
        {(activeTool === 'text' || (selectedAnnotation && selectedAnnotation.type === 'text')) && (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Size:</span>
              <select
                value={
                  selectedAnnotation && selectedAnnotation.type === 'text'
                    ? selectedAnnotation.fontSize
                    : toolSettings.fontSize
                }
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="px-2 py-0.5 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none"
              >
                {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((s) => (
                  <option key={s} value={s}>
                    {s}pt
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Font:</span>
              <select
                value={
                  selectedAnnotation && selectedAnnotation.type === 'text'
                    ? selectedAnnotation.fontFamily
                    : toolSettings.fontFamily
                }
                onChange={(e) => {
                  const font = e.target.value as any;
                  onChangeToolSettings({ fontFamily: font });
                  if (selectedAnnotation && selectedAnnotation.type === 'text') {
                    onUpdateSelectedAnnotation({ fontFamily: font });
                  }
                }}
                className="px-2 py-0.5 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none"
              >
                <option value="Helvetica">Helvetica (Sans)</option>
                <option value="Times-Roman">Times New Roman (Serif)</option>
                <option value="Courier">Courier (Monospace)</option>
              </select>
            </div>

            {/* Bold / Italic toggles */}
            {selectedAnnotation && selectedAnnotation.type === 'text' && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                <button
                  onClick={() =>
                    onUpdateSelectedAnnotation({ bold: !selectedAnnotation.bold })
                  }
                  className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                    selectedAnnotation.bold ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-600'
                  }`}
                >
                  B
                </button>
                <button
                  onClick={() =>
                    onUpdateSelectedAnnotation({ italic: !selectedAnnotation.italic })
                  }
                  className={`px-1.5 py-0.5 text-xs italic rounded font-serif ${
                    selectedAnnotation.italic ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-600'
                  }`}
                >
                  I
                </button>
              </div>
            )}
          </div>
        )}

        {/* Thickness controls for draw/shapes */}
        {['draw', 'highlight', 'rectangle', 'circle', 'line', 'arrow'].includes(activeTool) && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="font-semibold text-slate-600">Thickness:</span>
            {[1, 2, 4, 8, 16].map((w) => (
              <button
                key={w}
                onClick={() => handleStrokeWidthChange(w)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                  toolSettings.strokeWidth === w
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        )}

        {/* Fill color for shapes */}
        {['rectangle', 'circle'].includes(activeTool) && (
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <span className="font-semibold text-slate-600">Fill:</span>
            <button
              onClick={() => handleFillColorChange('transparent')}
              className={`px-2 py-0.5 rounded text-xs border ${
                toolSettings.fillColor === 'transparent'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              None
            </button>
            <button
              onClick={() => handleFillColorChange('#ffffff')}
              className={`w-5 h-5 rounded-full border border-slate-300 bg-white ${
                toolSettings.fillColor === '#ffffff' ? 'ring-2 ring-blue-500' : ''
              }`}
              title="White Fill"
            />
            <button
              onClick={() => handleFillColorChange('#fef08a')}
              className={`w-5 h-5 rounded-full border border-slate-300 bg-yellow-200 ${
                toolSettings.fillColor === '#fef08a' ? 'ring-2 ring-blue-500' : ''
              }`}
              title="Yellow Fill"
            />
          </div>
        )}

        {/* Redact options */}
        {activeTool === 'redact' && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="font-semibold text-slate-600">Mode:</span>
            <button
              onClick={() => onChangeToolSettings({ color: '#000000' })}
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                toolSettings.color === '#000000'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Blackout
            </button>
            <button
              onClick={() => onChangeToolSettings({ color: '#ffffff' })}
              className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                toolSettings.color === '#ffffff'
                  ? 'border-slate-900 bg-white text-slate-900 font-bold'
                  : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              Whiteout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
