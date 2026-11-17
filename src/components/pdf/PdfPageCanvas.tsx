'use client';

import React, { useRef, useEffect, useState, useMemo, memo } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type {
  PageInfo,
  Annotation,
  ToolType,
  ToolSettings,
  Point,
  TextAnnotation,
  DrawingAnnotation,
  ShapeAnnotation,
  RedactAnnotation,
  StampAnnotation,
} from '@/types/pdf';
import { renderPdfPage } from '@/lib/pdf/loader';
import { extractPageTextItems, type ExtractedTextItem } from '@/lib/pdf/text-extractor';
import { Trash2, Edit3 } from 'lucide-react';

interface PdfPageCanvasProps {
  doc: PDFDocumentProxy | null;
  page: PageInfo;
  scale: number;
  activeTool: ToolType;
  toolSettings: ToolSettings;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  isActivePage: boolean;
  onPageClick: () => void;
}

export const PdfPageCanvas = memo(function PdfPageCanvas({
  doc,
  page,
  scale,
  activeTool,
  toolSettings,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  isActivePage,
  onPageClick,
}: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Lazy render state: render when in viewport
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Extracted original PDF text items
  const [extractedTexts, setExtractedTexts] = useState<ExtractedTextItem[]>([]);
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  // Direct in-place inline text editing target (Direct in the PDF, NO separate modal popup)
  const [editingTarget, setEditingTarget] = useState<{
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    existingAnnotationId?: string;
  } | null>(null);

  // Drawing / Dragging state
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionStart, setInteractionStart] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [tempBox, setTempBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Moving existing annotation state
  const [isDraggingSelected, setIsDraggingSelected] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialResizeBox, setInitialResizeBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Inline new text annotation editing state
  const [editingNewTextId, setEditingNewTextId] = useState<string | null>(null);

  // Filter annotations for this page
  const pageAnnotations = useMemo(
    () => annotations.filter((a) => a.pageIndex === page.pageIndex),
    [annotations, page.pageIndex]
  );
  const selectedAnnotation = pageAnnotations.find((a) => a.id === selectedAnnotationId);

  // 1. Intersection Observer for fast lazy rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. High-performance canvas rendering
  useEffect(() => {
    let isCancelled = false;
    if (!doc || !canvasRef.current || !isVisible) return;

    renderPdfPage(doc, page.originalIndex + 1, canvasRef.current, scale, page.rotation)
      .then(() => {
        if (!isCancelled) setIsRendered(true);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to render PDF page:', err);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [doc, page.originalIndex, page.rotation, scale, isVisible]);

  // 3. Extract text content from the original PDF page for in-place editing
  useEffect(() => {
    let isCancelled = false;
    if (!doc) return;

    doc.getPage(page.originalIndex + 1).then(async (pageProxy: PDFPageProxy) => {
      if (isCancelled) return;
      const items = await extractPageTextItems(pageProxy, page.rotation);
      if (!isCancelled) {
        setExtractedTexts(items);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [doc, page.originalIndex, page.rotation]);

  // Convert client pointer event coordinates to PDF point coordinates (unscaled)
  const getPdfCoordinates = (e: React.PointerEvent): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const pxX = e.clientX - rect.left;
    const pxY = e.clientY - rect.top;
    return {
      x: pxX / scale,
      y: pxY / scale,
    };
  };

  // Trigger direct editing of an existing PDF text item right in place
  const startEditingTextItem = (item: ExtractedTextItem) => {
    onPageClick();
    onSelectAnnotation(null); // Clear selection so there is no double selection outline

    // Check if there is already an existing replacement annotation here
    const existingAnn = pageAnnotations.find(
      (a) =>
        a.type === 'text' &&
        (a as TextAnnotation).isReplacement &&
        Math.abs(a.x - item.x) < 25 &&
        Math.abs(a.y - item.y) < 20
    ) as TextAnnotation | undefined;

    setEditingTarget({
      id: item.id,
      text: existingAnn ? existingAnn.text : item.text,
      x: existingAnn ? existingAnn.x : item.x,
      y: existingAnn ? existingAnn.y : item.y,
      width: existingAnn ? existingAnn.width : item.width,
      height: existingAnn ? existingAnn.height : item.height,
      fontSize: existingAnn ? existingAnn.fontSize : item.fontSize,
      existingAnnotationId: existingAnn?.id,
    });
  };

  // Commit direct in-place edit on existing PDF text (Solid Black, clear white background mask)
  const handleSaveExistingTextEdit = (newText: string) => {
    if (!editingTarget) return;

    const trimmed = newText.trim();
    if (!trimmed) {
      setEditingTarget(null);
      return;
    }

    if (editingTarget.existingAnnotationId) {
      onUpdateAnnotation(editingTarget.existingAnnotationId, {
        text: newText,
        color: '#000000', // Always black
      });
    } else {
      const annId = `replace-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const replacementAnnotation: TextAnnotation = {
        id: annId,
        pageIndex: page.pageIndex,
        type: 'text',
        text: newText,
        fontSize: editingTarget.fontSize,
        fontFamily: 'Helvetica',
        color: '#000000', // Guaranteed pure solid black (never white!)
        x: editingTarget.x,
        y: editingTarget.y,
        width: Math.max(editingTarget.width, 30),
        height: editingTarget.height,
        isReplacement: true,
        coverWidth: Math.max(editingTarget.width, 30) + 6,
        coverHeight: Math.max(editingTarget.height, editingTarget.fontSize * 1.35) + 3,
        originalText: editingTarget.text,
      };
      onAddAnnotation(replacementAnnotation);
      if (activeTool !== 'editText') {
        onSelectAnnotation(annId);
      } else {
        onSelectAnnotation(null);
      }
    }

    setEditingTarget(null);
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    onPageClick();
    if (e.button !== 0) return;

    // In direct edit mode or select mode, do not draw on background
    if (activeTool === 'editText' || activeTool === 'select') {
      if (selectedAnnotationId && !(e.target as HTMLElement).closest('.annotation-item')) {
        onSelectAnnotation(null);
      }
      return;
    }

    const pt = getPdfCoordinates(e);

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsInteracting(true);
    setInteractionStart(pt);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setCurrentPoints([pt]);
    } else if (['rectangle', 'circle', 'redact'].includes(activeTool)) {
      setTempBox({ x: pt.x, y: pt.y, width: 0, height: 0 });
    } else if (activeTool === 'line' || activeTool === 'arrow') {
      setCurrentPoints([pt, pt]);
    } else if (activeTool === 'stamp') {
      const stampId = `stamp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const stampLabels: Record<string, string> = {
        approved: 'APPROVED',
        confidential: 'CONFIDENTIAL',
        urgent: 'URGENT',
        draft: 'DRAFT',
        checkmark: '✓ COMPLETED',
        cross: '✗ REJECTED',
      };
      const newStamp: StampAnnotation = {
        id: stampId,
        pageIndex: page.pageIndex,
        type: 'stamp',
        stampType: toolSettings.stampType,
        label: stampLabels[toolSettings.stampType] || toolSettings.stampType.toUpperCase(),
        color: toolSettings.color,
        x: Math.max(0, pt.x - 60),
        y: Math.max(0, pt.y - 20),
        width: 130,
        height: 42,
      };
      onAddAnnotation(newStamp);
      onSelectAnnotation(stampId);
      setIsInteracting(false);
    } else if (activeTool === 'text') {
      const textId = `text-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newText: TextAnnotation = {
        id: textId,
        pageIndex: page.pageIndex,
        type: 'text',
        text: 'Type text here...',
        fontSize: toolSettings.fontSize,
        fontFamily: toolSettings.fontFamily,
        color: toolSettings.color && toolSettings.color !== '#ffffff' ? toolSettings.color : '#000000',
        x: pt.x,
        y: pt.y,
        width: 140,
        height: toolSettings.fontSize * 1.5,
      };
      onAddAnnotation(newText);
      onSelectAnnotation(textId);
      setEditingNewTextId(textId);
      setIsInteracting(false);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    const pt = getPdfCoordinates(e);

    // Moving selected annotation
    if (isDraggingSelected && selectedAnnotation && interactionStart) {
      const newX = Math.round(pt.x - dragOffset.x);
      const newY = Math.round(pt.y - dragOffset.y);
      onUpdateAnnotation(selectedAnnotation.id, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      });
      return;
    }

    // Resizing selected annotation
    if (isResizing && selectedAnnotation && initialResizeBox) {
      let newW = initialResizeBox.w;
      let newH = initialResizeBox.h;
      let newX = initialResizeBox.x;
      let newY = initialResizeBox.y;

      if (resizeHandle === 'se') {
        newW = Math.max(20, pt.x - initialResizeBox.x);
        newH = Math.max(15, pt.y - initialResizeBox.y);
      } else if (resizeHandle === 'sw') {
        newW = Math.max(20, initialResizeBox.x + initialResizeBox.w - pt.x);
        newH = Math.max(15, pt.y - initialResizeBox.y);
        newX = pt.x;
      } else if (resizeHandle === 'ne') {
        newW = Math.max(20, pt.x - initialResizeBox.x);
        newH = Math.max(15, initialResizeBox.y + initialResizeBox.h - pt.y);
        newY = pt.y;
      } else if (resizeHandle === 'nw') {
        newW = Math.max(20, initialResizeBox.x + initialResizeBox.w - pt.x);
        newH = Math.max(15, initialResizeBox.y + initialResizeBox.h - pt.y);
        newX = pt.x;
        newY = pt.y;
      }

      onUpdateAnnotation(selectedAnnotation.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
      return;
    }

    if (!isInteracting || !interactionStart) return;

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setCurrentPoints((prev) => [...prev, pt]);
    } else if (['rectangle', 'circle', 'redact'].includes(activeTool)) {
      const minX = Math.min(interactionStart.x, pt.x);
      const minY = Math.min(interactionStart.y, pt.y);
      const w = Math.abs(pt.x - interactionStart.x);
      const h = Math.abs(pt.y - interactionStart.y);
      setTempBox({ x: minX, y: minY, width: w, height: h });
    } else if (activeTool === 'line' || activeTool === 'arrow') {
      setCurrentPoints([interactionStart, pt]);
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    if (isDraggingSelected) {
      setIsDraggingSelected(false);
      return;
    }

    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setInitialResizeBox(null);
      return;
    }

    if (!isInteracting) return;
    setIsInteracting(false);

    const annId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    if ((activeTool === 'draw' || activeTool === 'highlight') && currentPoints.length > 1) {
      const isHighlighter = activeTool === 'highlight';
      const newDraw: DrawingAnnotation = {
        id: annId,
        pageIndex: page.pageIndex,
        type: isHighlighter ? 'highlight' : 'draw',
        points: currentPoints,
        strokeColor: isHighlighter ? '#facc15' : toolSettings.color,
        strokeWidth: isHighlighter ? 18 : toolSettings.strokeWidth,
        isHighlighter: isHighlighter,
        x: Math.min(...currentPoints.map((p) => p.x)),
        y: Math.min(...currentPoints.map((p) => p.y)),
        width: Math.max(...currentPoints.map((p) => p.x)) - Math.min(...currentPoints.map((p) => p.x)),
        height: Math.max(...currentPoints.map((p) => p.y)) - Math.min(...currentPoints.map((p) => p.y)),
      };
      onAddAnnotation(newDraw);
    } else if (['rectangle', 'circle'].includes(activeTool) && tempBox && tempBox.width > 5 && tempBox.height > 5) {
      const newShape: ShapeAnnotation = {
        id: annId,
        pageIndex: page.pageIndex,
        type: activeTool as 'rectangle' | 'circle',
        x: tempBox.x,
        y: tempBox.y,
        width: tempBox.width,
        height: tempBox.height,
        strokeColor: toolSettings.color,
        strokeWidth: toolSettings.strokeWidth,
        fillColor: toolSettings.fillColor,
      };
      onAddAnnotation(newShape);
      onSelectAnnotation(annId);
    } else if (activeTool === 'redact' && tempBox && tempBox.width > 5 && tempBox.height > 5) {
      const newRedact: RedactAnnotation = {
        id: annId,
        pageIndex: page.pageIndex,
        type: 'redact',
        x: tempBox.x,
        y: tempBox.y,
        width: tempBox.width,
        height: tempBox.height,
        color: toolSettings.color,
      };
      onAddAnnotation(newRedact);
      onSelectAnnotation(annId);
    } else if ((activeTool === 'line' || activeTool === 'arrow') && currentPoints.length === 2) {
      const p1 = currentPoints[0];
      const p2 = currentPoints[1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (dist > 5) {
        const newLine: ShapeAnnotation = {
          id: annId,
          pageIndex: page.pageIndex,
          type: activeTool as 'line' | 'arrow',
          x: p1.x,
          y: p1.y,
          width: p2.x - p1.x,
          height: p2.y - p1.y,
          strokeColor: toolSettings.color,
          strokeWidth: toolSettings.strokeWidth,
          endPoint: p2,
        };
        onAddAnnotation(newLine);
        onSelectAnnotation(annId);
      }
    }

    setInteractionStart(null);
    setCurrentPoints([]);
    setTempBox(null);
  };

  const pointsToSvgPath = (points: Point[]): string => {
    if (!points || points.length === 0) return '';
    return points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  };

  const startDragAnnotation = (e: React.PointerEvent, ann: Annotation) => {
    e.stopPropagation();
    onSelectAnnotation(ann.id);

    if (activeTool !== 'select') return;

    const pt = getPdfCoordinates(e);
    setIsDraggingSelected(true);
    setInteractionStart(pt);
    setDragOffset({
      x: pt.x - ann.x,
      y: pt.y - ann.y,
    });
  };

  const startResize = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    if (!selectedAnnotation) return;
    setIsResizing(true);
    setResizeHandle(handle);
    setInitialResizeBox({
      x: selectedAnnotation.x,
      y: selectedAnnotation.y,
      w: selectedAnnotation.width,
      h: selectedAnnotation.height,
    });
  };

  const getCursorClass = () => {
    if (activeTool === 'editText') return 'cursor-text';
    if (activeTool === 'select') return 'cursor-default';
    if (activeTool === 'text') return 'cursor-text';
    if (['draw', 'highlight'].includes(activeTool)) return 'cursor-crosshair';
    if (['rectangle', 'circle', 'line', 'arrow', 'redact'].includes(activeTool)) return 'cursor-crosshair';
    if (activeTool === 'stamp') return 'cursor-copy';
    return 'cursor-default';
  };

  const isRotated = page.rotation % 180 !== 0;
  const displayWidth = (isRotated ? page.height : page.width) * scale;
  const displayHeight = (isRotated ? page.width : page.height) * scale;

  return (
    <div
      ref={containerRef}
      onClick={onPageClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative mx-auto bg-white shadow-xl rounded-sm select-none mb-8 ${getCursorClass()} ${
        isActivePage ? 'ring-2 ring-indigo-500/40 shadow-2xl' : ''
      }`}
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
    >
      {/* 1. Underlying Crisp PDF.js Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-none z-0" />

      {/* Loading Skeleton if not yet rendered */}
      {!isRendered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 text-slate-400 z-1">
          <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs font-semibold">Loading page {page.pageIndex + 1}...</span>
        </div>
      )}

      {/* 2. Interactive SVG Vector Layer (Drawings, Highlights, Lines) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-5"
        viewBox={`0 0 ${page.width} ${page.height}`}
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
        }}
      >
        {/* Render Highlights first */}
        {pageAnnotations
          .filter((a) => a.type === 'highlight' || (a.type === 'draw' && a.isHighlighter))
          .map((a: any) => (
            <path
              key={a.id}
              d={pointsToSvgPath(a.points)}
              stroke={a.strokeColor || '#facc15'}
              strokeWidth={a.strokeWidth || 18}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.4}
            />
          ))}

        {/* Render Pens & Vector Shapes */}
        {pageAnnotations
          .filter((a) => a.type === 'draw' && !a.isHighlighter)
          .map((a: any) => (
            <path
              key={a.id}
              d={pointsToSvgPath(a.points)}
              stroke={a.strokeColor}
              strokeWidth={a.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}

        {/* Active In-Progress Vector Path */}
        {(activeTool === 'draw' || activeTool === 'highlight') && currentPoints.length > 1 && (
          <path
            d={pointsToSvgPath(currentPoints)}
            stroke={activeTool === 'highlight' ? '#facc15' : toolSettings.color}
            strokeWidth={activeTool === 'highlight' ? 18 : toolSettings.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={activeTool === 'highlight' ? 0.4 : 1}
          />
        )}

        {/* Active In-Progress Line/Arrow */}
        {(activeTool === 'line' || activeTool === 'arrow') && currentPoints.length === 2 && (
          <line
            x1={currentPoints[0].x}
            y1={currentPoints[0].y}
            x2={currentPoints[1].x}
            y2={currentPoints[1].y}
            stroke={toolSettings.color}
            strokeWidth={toolSettings.strokeWidth}
            strokeDasharray="4 4"
          />
        )}
      </svg>

      {/* 3. Original PDF Text Interactive Layer (Clickable directly on the PDF) */}
      {(activeTool === 'editText' || activeTool === 'select') && (
        <div
          className={`absolute inset-0 overflow-hidden pointer-events-none ${
            activeTool === 'editText' ? 'z-30' : 'z-15'
          }`}
          style={{
            transformOrigin: '0 0',
            transform: `scale(${scale})`,
            width: `${page.width}px`,
            height: `${page.height}px`,
          }}
        >
          {extractedTexts.map((item) => {
            const isHovered = hoveredTextId === item.id;
            const isEditing = editingTarget?.id === item.id;

            return (
              <div
                key={item.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  startEditingTextItem(item);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  startEditingTextItem(item);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditingTextItem(item);
                }}
                onMouseEnter={() => setHoveredTextId(item.id)}
                onMouseLeave={() => setHoveredTextId(null)}
                className={`absolute pointer-events-auto cursor-text rounded-xs transition-all ${
                  isEditing
                    ? 'opacity-0 pointer-events-none'
                    : activeTool === 'editText'
                    ? 'border-2 border-dashed border-indigo-400 bg-indigo-50/25 hover:bg-indigo-100/70 hover:border-indigo-600 shadow-2xs'
                    : isHovered
                    ? 'border border-dashed border-indigo-400 bg-indigo-50/40'
                    : 'border border-transparent'
                }`}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width + 4}px`,
                  height: `${item.height + 2}px`,
                }}
                title={
                  activeTool === 'editText'
                    ? `Click to edit directly: "${item.text}"`
                    : `Double click to edit: "${item.text}"`
                }
              >
                {/* Visual helper badge on hover */}
                {activeTool === 'editText' && isHovered && (
                  <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-50 flex items-center gap-1">
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Click to edit direct</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. DIRECT INLINE TEXT INPUT (Types directly inside the PDF in BLACK with zero popup) */}
      {editingTarget && (
        <div
          className="absolute z-50 pointer-events-auto"
          style={{
            transformOrigin: '0 0',
            transform: `scale(${scale})`,
            left: `${editingTarget.x - 2}px`,
            top: `${editingTarget.y - 2}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Solid white background mask covering the original text underneath completely */}
          <div
            className="absolute bg-white rounded-xs shadow-xs"
            style={{
              left: 0,
              top: 0,
              width: `${Math.max(editingTarget.width, 60) + 16}px`,
              height: `${Math.max(editingTarget.height, editingTarget.fontSize * 1.35) + 4}px`,
            }}
          />

          <input
            autoFocus
            type="text"
            defaultValue={editingTarget.text}
            onChange={(e) => {
              const len = e.target.value.length;
              const approxW = len * (editingTarget.fontSize * 0.58);
              e.target.style.width = `${Math.max(approxW + 24, 60)}px`;
            }}
            onBlur={(e) => {
              handleSaveExistingTextEdit(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveExistingTextEdit((e.target as HTMLInputElement).value);
              } else if (e.key === 'Escape') {
                setEditingTarget(null);
              }
            }}
            style={{
              fontSize: `${editingTarget.fontSize}px`,
              lineHeight: 1.15,
              color: '#000000', // Pure Solid Black
              fontFamily: 'Helvetica, Arial, sans-serif',
              width: `${Math.max(editingTarget.width + 24, 60)}px`,
              height: `${Math.max(editingTarget.height, editingTarget.fontSize * 1.35)}px`,
            }}
            className="relative z-10 bg-white text-black font-semibold border-2 border-indigo-600 rounded-xs px-1.5 py-0 outline-none shadow-sm leading-tight select-text"
          />

          {/* Quick tip pill */}
          <div className="absolute top-full left-0 mt-1 bg-slate-900 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none z-50 flex items-center gap-1.5 opacity-90">
            <span>Press Enter ↵ or click away to save</span>
          </div>
        </div>
      )}

      {/* 5. Annotations Overlay (Text, Shapes, Redaction, Signatures, Images, Stamps) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-20"
        style={{
          transformOrigin: '0 0',
          transform: `scale(${scale})`,
          width: `${page.width}px`,
          height: `${page.height}px`,
        }}
      >
        {pageAnnotations.map((ann) => {
          const isSelected = ann.id === selectedAnnotationId;

          return (
            <div
              key={ann.id}
              onPointerDown={(e) => startDragAnnotation(e, ann)}
              className={`annotation-item pointer-events-auto absolute group ${
                isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 z-30' : 'hover:ring-1 hover:ring-indigo-300 z-20'
              } ${activeTool === 'select' ? 'cursor-move' : ''}`}
              style={{
                left: `${ann.x}px`,
                top: `${ann.y}px`,
                width: `${ann.width}px`,
                height: `${ann.height}px`,
              }}
            >
              {/* Type: Text (including Direct In-Place Replacement Text) */}
              {ann.type === 'text' && (
                <div className="w-full h-full relative flex items-center">
                  {/* Clean whiteout backing for replaced original text */}
                  {ann.isReplacement && (
                    <div
                      className="absolute bg-white pointer-events-none rounded-xs"
                      style={{
                        left: '-2px',
                        top: '-2px',
                        width: `${(ann.coverWidth || ann.width) + 8}px`,
                        height: `${(ann.coverHeight || ann.height) + 4}px`,
                      }}
                    />
                  )}

                  {editingNewTextId === ann.id ? (
                    <textarea
                      autoFocus
                      defaultValue={ann.text}
                      onBlur={(e) => {
                        onUpdateAnnotation(ann.id, { text: e.target.value });
                        setEditingNewTextId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingNewTextId(null);
                      }}
                      style={{
                        fontSize: `${ann.fontSize}px`,
                        fontFamily: ann.fontFamily,
                        color: ann.color && ann.color !== '#ffffff' ? ann.color : '#000000',
                        fontWeight: ann.bold ? 'bold' : 'normal',
                        fontStyle: ann.italic ? 'italic' : 'normal',
                      }}
                      className="relative z-10 w-full h-full bg-white text-black border border-indigo-400 rounded-xs p-0.5 outline-none resize-none shadow-xs"
                    />
                  ) : (
                    <div
                      onClick={(e) => {
                        if (ann.isReplacement && (activeTool === 'editText' || activeTool === 'select')) {
                          e.stopPropagation();
                          startEditingTextItem({
                            id: ann.id,
                            text: ann.text,
                            x: ann.x,
                            y: ann.y,
                            width: ann.width,
                            height: ann.height,
                            fontSize: ann.fontSize,
                            fontFamily: ann.fontFamily,
                          });
                        }
                      }}
                      onDoubleClick={() => {
                        if (!ann.isReplacement) {
                          setEditingNewTextId(ann.id);
                        }
                      }}
                      style={{
                        fontSize: `${ann.fontSize}px`,
                        fontFamily: ann.fontFamily || 'Helvetica',
                        color: (ann.color && ann.color !== '#ffffff') ? ann.color : '#000000', // Solid visible black!
                        fontWeight: ann.bold ? 'bold' : 'normal',
                        fontStyle: ann.italic ? 'italic' : 'normal',
                        backgroundColor: ann.isReplacement
                          ? 'transparent'
                          : ann.backgroundColor || 'transparent',
                      }}
                      className="relative z-10 whitespace-pre-wrap select-text leading-tight w-full cursor-text text-black"
                    >
                      {ann.text}
                    </div>
                  )}
                </div>
              )}

              {/* Type: Rectangle */}
              {ann.type === 'rectangle' && (
                <div
                  className="w-full h-full rounded-xs"
                  style={{
                    border: `${ann.strokeWidth}px solid ${ann.strokeColor}`,
                    backgroundColor: ann.fillColor || 'transparent',
                  }}
                />
              )}

              {/* Type: Circle */}
              {ann.type === 'circle' && (
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    border: `${ann.strokeWidth}px solid ${ann.strokeColor}`,
                    backgroundColor: ann.fillColor || 'transparent',
                  }}
                />
              )}

              {/* Type: Line / Arrow */}
              {(ann.type === 'line' || ann.type === 'arrow') && ann.endPoint && (
                <svg className="w-full h-full overflow-visible pointer-events-none">
                  <line
                    x1="0"
                    y1="0"
                    x2={ann.endPoint.x - ann.x}
                    y2={ann.endPoint.y - ann.y}
                    stroke={ann.strokeColor}
                    strokeWidth={ann.strokeWidth}
                  />
                  {ann.type === 'arrow' && (
                    <circle
                      cx={ann.endPoint.x - ann.x}
                      cy={ann.endPoint.y - ann.y}
                      r={ann.strokeWidth * 2}
                      fill={ann.strokeColor}
                    />
                  )}
                </svg>
              )}

              {/* Type: Redact / Whiteout */}
              {ann.type === 'redact' && (
                <div
                  className="w-full h-full shadow-xs"
                  style={{
                    backgroundColor: ann.color,
                  }}
                />
              )}

              {/* Type: Signature or Image */}
              {(ann.type === 'signature' || ann.type === 'image') && ann.dataUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={ann.dataUrl}
                  alt={ann.type}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              )}

              {/* Type: Stamp */}
              {ann.type === 'stamp' && (
                <div
                  className="w-full h-full border-2 rounded-md flex items-center justify-center font-black tracking-widest text-center px-1"
                  style={{
                    borderColor: ann.color,
                    color: ann.color,
                    backgroundColor: `${ann.color}15`,
                    fontSize: `${Math.min(ann.height * 0.42, 16)}px`,
                  }}
                >
                  {ann.label || ann.stampType.toUpperCase()}
                </div>
              )}

              {/* Selection Controls (Clean Floating Action Toolbar ABOVE box - never overrides edges) */}
              {isSelected && (
                <>
                  <div
                    className="absolute -top-7 right-0 flex items-center gap-1 bg-white border border-slate-300 shadow-md rounded-md px-1.5 py-0.5 z-40 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAnnotation(ann.id);
                      }}
                      className="flex items-center gap-1 px-1 py-0.5 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Delete selected item"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Corner Resize Handles ONLY for non-text elements (shapes, images, redact) so text is not crowded */}
                  {ann.type !== 'text' && (
                    <>
                      <div
                        onPointerDown={(e) => startResize(e, 'nw')}
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize z-30 shadow-2xs"
                      />
                      <div
                        onPointerDown={(e) => startResize(e, 'ne')}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full cursor-nesw-resize z-30 shadow-2xs"
                      />
                      <div
                        onPointerDown={(e) => startResize(e, 'sw')}
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full cursor-nesw-resize z-30 shadow-2xs"
                      />
                      <div
                        onPointerDown={(e) => startResize(e, 'se')}
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize z-30 shadow-2xs"
                      />
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Temporary Box while dragging to create shape/redact */}
        {tempBox && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${tempBox.x}px`,
              top: `${tempBox.y}px`,
              width: `${tempBox.width}px`,
              height: `${tempBox.height}px`,
              border:
                activeTool === 'redact'
                  ? '2px dashed #e11d48'
                  : `${toolSettings.strokeWidth}px dashed ${toolSettings.color}`,
              backgroundColor:
                activeTool === 'redact'
                  ? toolSettings.color
                  : toolSettings.fillColor !== 'transparent'
                  ? toolSettings.fillColor
                  : 'transparent',
              opacity: activeTool === 'redact' ? 0.8 : 0.6,
            }}
          />
        )}
      </div>

      {/* Page indicator watermark on hover */}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Page {page.pageIndex + 1}
      </div>
    </div>
  );
});
