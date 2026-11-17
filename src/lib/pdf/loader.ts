'use client';

import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import type { PageInfo } from '@/types/pdf';

let pdfjsLibInstance: typeof import('pdfjs-dist') | null = null;

export async function getPdfJs() {
  if (typeof window === 'undefined') return null;
  if (!pdfjsLibInstance) {
    const pdfjs = await import('pdfjs-dist');
    // Set local static public worker
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    pdfjsLibInstance = pdfjs;
  }
  return pdfjsLibInstance;
}

export async function loadPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) {
    throw new Error('PDF.js could not be loaded in this environment');
  }

  // Fast local loading using local static cMaps and standard fonts (Zero network requests!)
  const loadingTask = pdfjs.getDocument({
    data: data.slice(0),
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/standard_fonts/',
    disableAutoFetch: true,
    disableStream: true,
  });

  return await loadingTask.promise;
}

export async function extractPdfPagesInfo(doc: PDFDocumentProxy): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];
  const numPages = doc.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    pages.push({
      pageIndex: i - 1,
      originalIndex: i - 1,
      width: viewport.width,
      height: viewport.height,
      rotation: page.rotate || 0,
    });
  }

  return pages;
}

// Track active rendering tasks to prevent collisions or memory leaks
const activeRenderTasks = new WeakMap<HTMLCanvasElement, RenderTask>();

export async function renderPdfPage(
  doc: PDFDocumentProxy,
  pageNumber: number, // 1-based
  canvas: HTMLCanvasElement,
  scale: number = 1.0,
  rotation: number = 0
): Promise<{ width: number; height: number }> {
  // Cancel previous render on this canvas if still in progress
  const existingTask = activeRenderTasks.get(canvas);
  if (existingTask) {
    try {
      existingTask.cancel();
    } catch {
      // Ignore cancellation exceptions
    }
    activeRenderTasks.delete(canvas);
  }

  const page: PDFPageProxy = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation });

  // Cap pixel ratio to 1.5 or 2 for high performance and lower memory usage
  const rawRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const pixelRatio = Math.min(rawRatio, 1.75);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Cannot get 2D context from canvas');
  }

  const targetWidth = Math.floor(viewport.width * pixelRatio);
  const targetHeight = Math.floor(viewport.height * pixelRatio);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  context.save();
  context.scale(pixelRatio, pixelRatio);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  const renderTask = page.render(renderContext);
  activeRenderTasks.set(canvas, renderTask);

  try {
    await renderTask.promise;
  } catch (err: any) {
    // If cancelled, silently exit
    if (err?.name === 'RenderingCancelledException') {
      return { width: viewport.width, height: viewport.height };
    }
    throw err;
  } finally {
    context.restore();
    if (activeRenderTasks.get(canvas) === renderTask) {
      activeRenderTasks.delete(canvas);
    }
  }

  return { width: viewport.width, height: viewport.height };
}
