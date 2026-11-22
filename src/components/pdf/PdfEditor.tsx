'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type {
  PageInfo,
  Annotation,
  ToolType,
  ToolSettings,
  HistoryStep,
} from '@/types/pdf';
import { loadPdfDocument, extractPdfPagesInfo } from '@/lib/pdf/loader';
import { exportEditedPdf } from '@/lib/pdf/exporter';
import { PdfToolbar } from './PdfToolbar';
import { PdfPageThumbnailSidebar } from './PdfPageThumbnailSidebar';
import { PdfPageCanvas } from './PdfPageCanvas';
import { PdfSignatureModal } from './PdfSignatureModal';
import { PdfImageModal } from './PdfImageModal';
import { PdfShortcutsModal } from './PdfShortcutsModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PdfEditorProps {
  initialFile: File | null;
  initialArrayBuffer: ArrayBuffer | null;
  onReset: () => void;
}

const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  color: '#0f172a',
  strokeWidth: 2,
  fontSize: 16,
  fontFamily: 'Helvetica',
  fillColor: 'transparent',
  opacity: 1,
  stampType: 'approved',
};

export function PdfEditor({ initialFile, initialArrayBuffer, onReset }: PdfEditorProps) {
  // Document state
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [fileName, setFileName] = useState(initialFile ? initialFile.name : 'Document.pdf');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Viewport / Tool state
  const [scale, setScale] = useState<number>(1.2);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [toolSettings, setToolSettings] = useState<ToolSettings>(DEFAULT_TOOL_SETTINGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Export & Feedback
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Latest state mirrors so history commits never read stale closures
  const annotationsRef = useRef<Annotation[]>([]);
  const pagesRef = useRef<PageInfo[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  annotationsRef.current = annotations;
  pagesRef.current = pages;
  historyIndexRef.current = historyIndex;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Show Toast Helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Push state to Undo History
  const pushHistory = useCallback(
    (newAnnotations: Annotation[], newPages: PageInfo[]) => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
      const at = historyIndexRef.current;
      historyIndexRef.current = at + 1;
      setHistory((prev) => {
        const next = prev.slice(0, at + 1);
        return [...next, { annotations: newAnnotations, pages: newPages }];
      });
      setHistoryIndex(at + 1);
    },
    []
  );

  // Load PDF document on mount
  useEffect(() => {
    let isCancelled = false;
    if (!initialArrayBuffer) return;

    loadPdfDocument(initialArrayBuffer)
      .then(async (loadedDoc) => {
        if (isCancelled) return;
        setDoc(loadedDoc);
        const pagesInfo = await extractPdfPagesInfo(loadedDoc);
        setPages(pagesInfo);
        // Initial history
        setHistory([{ annotations: [], pages: pagesInfo }]);
        setHistoryIndex(0);
      })
      .catch((err) => {
        console.error('Failed to load PDF in editor:', err);
        showToast('Error opening PDF document.', 'error');
      });

    return () => {
      isCancelled = true;
    };
  }, [initialArrayBuffer]);

  // Undo
  const handleUndo = useCallback(() => {
    if (updateTimerRef.current) {
      // Commit the pending edit first so undo reverts it rather than skipping it
      pushHistory(annotationsRef.current, pagesRef.current);
      return;
    }
    if (historyIndex > 0) {
      const prevStep = history[historyIndex - 1];
      setAnnotations(prevStep.annotations);
      setPages(prevStep.pages);
      setHistoryIndex((prev) => prev - 1);
      setSelectedAnnotationId(null);
    }
  }, [history, historyIndex, pushHistory]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextStep = history[historyIndex + 1];
      setAnnotations(nextStep.annotations);
      setPages(nextStep.pages);
      setHistoryIndex((prev) => prev + 1);
      setSelectedAnnotationId(null);
    }
  }, [history, historyIndex]);

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.15).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.4, +(s - 0.15).toFixed(2)));
  const handleZoomFit = () => setScale(1.0);

  // Add Annotation
  const handleAddAnnotation = (annotation: Annotation) => {
    const updated = [...annotations, annotation];
    setAnnotations(updated);
    pushHistory(updated, pages);
  };

  // Update Annotation
  const handleUpdateAnnotation = (id: string, updates: Partial<Annotation>) => {
    const updated = annotationsRef.current.map((ann) => (ann.id === id ? ({ ...ann, ...updates } as Annotation) : ann));
    annotationsRef.current = updated;
    setAnnotations(updated);
    // Debounced history commit: a drag/resize/typing burst becomes one undo step
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      updateTimerRef.current = null;
      pushHistory(annotationsRef.current, pagesRef.current);
    }, 500);
  };

  // Delete Annotation
  const handleDeleteAnnotation = (id: string) => {
    const updated = annotations.filter((ann) => ann.id !== id);
    setAnnotations(updated);
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
    pushHistory(updated, pages);
  };

  // Page Operations: Rotate
  const handleRotatePage = (index: number) => {
    const updated = pages.map((p, i) =>
      i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    );
    setPages(updated);
    pushHistory(annotations, updated);
  };

  // Page Operations: Delete
  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      alert('Cannot delete the last remaining page of the document.');
      return;
    }
    const updated = pages.filter((_, i) => i !== index);
    const updatedAnnotations = annotations
      .filter((a) => a.pageIndex !== index)
      .map((a) => (a.pageIndex > index ? { ...a, pageIndex: a.pageIndex - 1 } : a));

    setPages(updated);
    setAnnotations(updatedAnnotations);
    if (activePageIndex >= updated.length) {
      setActivePageIndex(updated.length - 1);
    }
    pushHistory(updatedAnnotations, updated);
  };

  // Page Operations: Move / Reorder
  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);

    // Update annotation page indexes
    const updatedAnnotations = annotations.map((a) => {
      if (a.pageIndex === fromIndex) return { ...a, pageIndex: toIndex };
      if (fromIndex < toIndex && a.pageIndex > fromIndex && a.pageIndex <= toIndex) {
        return { ...a, pageIndex: a.pageIndex - 1 };
      }
      if (fromIndex > toIndex && a.pageIndex >= toIndex && a.pageIndex < fromIndex) {
        return { ...a, pageIndex: a.pageIndex + 1 };
      }
      return a;
    });

    setPages(newPages);
    setAnnotations(updatedAnnotations);
    setActivePageIndex(toIndex);
    pushHistory(updatedAnnotations, newPages);
  };

  // Page Operations: Duplicate Page
  const handleDuplicatePage = (index: number) => {
    const targetPage = pages[index];
    const duplicated: PageInfo = {
      ...targetPage,
      pageIndex: index + 1,
    };
    const newPages = [...pages];
    newPages.splice(index + 1, 0, duplicated);

    // Shift page indexes
    const updatedAnnotations = annotations.map((a) =>
      a.pageIndex > index ? { ...a, pageIndex: a.pageIndex + 1 } : a
    );

    setPages(newPages);
    setAnnotations(updatedAnnotations);
    setActivePageIndex(index + 1);
    pushHistory(updatedAnnotations, newPages);
  };

  // Page Operations: Add Blank Page
  const handleAddBlankPage = () => {
    const newPage: PageInfo = {
      pageIndex: pages.length,
      originalIndex: pages.length > 0 ? pages[0].originalIndex : 0,
      width: pages.length > 0 ? pages[pages.length - 1].width : 595.28,
      height: pages.length > 0 ? pages[pages.length - 1].height : 841.89,
      rotation: 0,
      isBlank: true,
    };
    const newPages = [...pages, newPage];
    setPages(newPages);
    setActivePageIndex(newPages.length - 1);
    pushHistory(annotations, newPages);
  };

  // Apply Signature from modal
  const handleApplySignature = (dataUrl: string) => {
    const sigId = `sig-${Date.now()}`;
    const activePage = pages[activePageIndex] || pages[0];
    const targetX = (activePage.width - 180) / 2;
    const targetY = (activePage.height - 70) / 2;

    const newSig: Annotation = {
      id: sigId,
      pageIndex: activePageIndex,
      type: 'signature',
      dataUrl: dataUrl,
      x: Math.max(20, targetX),
      y: Math.max(20, targetY),
      width: 180,
      height: 70,
      aspectRatio: 180 / 70,
    };

    handleAddAnnotation(newSig);
    setSelectedAnnotationId(sigId);
    setActiveTool('select');
  };

  // Apply Image from modal
  const handleApplyImage = (dataUrl: string, width: number, height: number) => {
    const imgId = `img-${Date.now()}`;
    const activePage = pages[activePageIndex] || pages[0];
    const targetX = (activePage.width - width) / 2;
    const targetY = (activePage.height - height) / 2;

    const newImg: Annotation = {
      id: imgId,
      pageIndex: activePageIndex,
      type: 'image',
      dataUrl: dataUrl,
      x: Math.max(20, targetX),
      y: Math.max(20, targetY),
      width: width,
      height: height,
      aspectRatio: width / height,
    };

    handleAddAnnotation(newImg);
    setSelectedAnnotationId(imgId);
    setActiveTool('select');
  };

  // Export to PDF and Download
  const handleExport = async () => {
    if (!initialArrayBuffer) return;
    setIsExporting(true);
    try {
      const pdfBytes = await exportEditedPdf(initialArrayBuffer, pages, annotations);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      downloadLink.download = `${cleanName}-edited.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      showToast('PDF exported and downloaded successfully!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export PDF. Check console for details.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (modifier && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId) {
          e.preventDefault();
          handleDeleteAnnotation(selectedAnnotationId);
        }
      } else if (e.key === 'Escape') {
        setActiveTool('select');
        setSelectedAnnotationId(null);
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('editText');
      } else if (e.key.toLowerCase() === 't') {
        setActiveTool('text');
      } else if (e.key.toLowerCase() === 'p') {
        setActiveTool('draw');
      } else if (e.key.toLowerCase() === 'h') {
        setActiveTool('highlight');
      } else if (e.key.toLowerCase() === 'r') {
        setActiveTool('rectangle');
      } else if (e.key.toLowerCase() === 'c') {
        setActiveTool('circle');
      } else if (e.key.toLowerCase() === 'x') {
        setActiveTool('redact');
      } else if (modifier && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
      } else if (modifier && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, handleUndo, handleRedo]);

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border border-slate-700'
              : 'bg-red-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Application Toolbar */}
      <PdfToolbar
        fileName={fileName}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        toolSettings={toolSettings}
        onChangeToolSettings={(s) => setToolSettings((prev) => ({ ...prev, ...s }))}
        selectedAnnotation={selectedAnnotation}
        onUpdateSelectedAnnotation={(updates) => {
          if (selectedAnnotationId) {
            handleUpdateAnnotation(selectedAnnotationId, updates);
          }
        }}
        onDeleteSelectedAnnotation={() => {
          if (selectedAnnotationId) {
            handleDeleteAnnotation(selectedAnnotationId);
          }
        }}
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        isExporting={isExporting}
        onResetDocument={onReset}
        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
        onOpenImageModal={() => setIsImageModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        currentPage={activePageIndex + 1}
        totalPages={pages.length}
      />

      {/* Active Direct Edit Banner */}
      {activeTool === 'editText' && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 bg-indigo-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-indigo-400/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Direct Edit Mode: Click on any existing text in the PDF to edit it in place</span>
        </div>
      )}

      {/* Main Workspace Area (Sidebar + Canvas Viewport) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Thumbnails & Page Management Sidebar */}
        <PdfPageThumbnailSidebar
          pages={pages}
          activePageIndex={activePageIndex}
          onSelectPage={(idx) => {
            setActivePageIndex(idx);
            pageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onRotatePage={handleRotatePage}
          onDeletePage={handleDeletePage}
          onDuplicatePage={handleDuplicatePage}
          onMovePage={handleMovePage}
          onAddBlankPage={handleAddBlankPage}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Center PDF Pages Canvas Viewport */}
        <main
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-200/70 p-6 md:p-8 flex flex-col items-center"
        >
          {pages.map((page, index) => (
            <div
              key={`${page.originalIndex}-${index}`}
              ref={(el) => {
                pageRefs.current[index] = el;
              }}
              className="w-full flex justify-center"
            >
              <PdfPageCanvas
                doc={doc}
                page={page}
                scale={scale}
                activeTool={activeTool}
                toolSettings={toolSettings}
                annotations={annotations}
                selectedAnnotationId={selectedAnnotationId}
                onSelectAnnotation={setSelectedAnnotationId}
                onAddAnnotation={handleAddAnnotation}
                onUpdateAnnotation={handleUpdateAnnotation}
                onDeleteAnnotation={handleDeleteAnnotation}
                isActivePage={activePageIndex === index}
                onPageClick={() => setActivePageIndex(index)}
              />
            </div>
          ))}
        </main>
      </div>

      {/* Modals */}
      <PdfSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onApplySignature={handleApplySignature}
      />

      <PdfImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onApplyImage={handleApplyImage}
      />

      <PdfShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
