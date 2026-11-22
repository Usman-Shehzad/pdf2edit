'use client';

import { PDFDocument } from 'pdf-lib';
import { zipSync } from 'fflate';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPdfDocument } from '@/lib/pdf/loader';

export interface OutputFile {
  name: string;
  blob: Blob;
}

const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: 'application/pdf' });
const baseName = (n: string) => n.replace(/\.[^/.]+$/, '');

/** Parses "1-3, 5, 8-" into 0-based page groups. Throws a readable error on bad input. */
export function parseRanges(input: string, total: number): number[][] {
  const groups: number[][] = [];
  for (const raw of input.split(',')) {
    const part = raw.trim();
    if (!part) continue;
    const m = /^(\d*)\s*-\s*(\d*)$/.exec(part) || /^(\d+)$/.exec(part);
    if (!m) throw new Error(`"${part}" is not a valid range`);
    let from: number;
    let to: number;
    if (m.length === 2) {
      from = to = parseInt(m[1], 10);
    } else {
      from = m[1] ? parseInt(m[1], 10) : 1;
      to = m[2] ? parseInt(m[2], 10) : total;
    }
    if (from < 1 || to > total || from > to) {
      throw new Error(`Range "${part}" is outside 1-${total}`);
    }
    groups.push(Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i));
  }
  if (groups.length === 0) throw new Error('Enter at least one page or range');
  return groups;
}

export async function countPages(buf: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(buf.slice(0), { ignoreEncryption: true });
  return doc.getPageCount();
}

export async function mergePdfs(files: File[]): Promise<OutputFile[]> {
  const out = await PDFDocument.create();
  for (const f of files) {
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return [{ name: 'merged.pdf', blob: pdfBlob(await out.save()) }];
}

export async function splitPdf(
  file: File,
  ranges: string,
  mode: 'extract' | 'split'
): Promise<OutputFile[]> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const groups = parseRanges(ranges, src.getPageCount());
  const base = baseName(file.name);

  const build = async (indices: number[]) => {
    const doc = await PDFDocument.create();
    (await doc.copyPages(src, indices)).forEach((p) => doc.addPage(p));
    return doc.save();
  };

  if (mode === 'extract') {
    return [{ name: `${base}-extracted.pdf`, blob: pdfBlob(await build(groups.flat())) }];
  }
  const entries: Record<string, Uint8Array> = {};
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const label = g.length === 1 ? `page-${g[0] + 1}` : `pages-${g[0] + 1}-${g[g.length - 1] + 1}`;
    entries[`${base}-${label}.pdf`] = await build(g);
  }
  if (groups.length === 1) {
    const [name, bytes] = Object.entries(entries)[0];
    return [{ name, blob: pdfBlob(bytes) }];
  }
  return [{ name: `${base}-split.zip`, blob: new Blob([zipSync(entries, { level: 0 }) as BlobPart], { type: 'application/zip' }) }];
}

async function pageToCanvas(doc: PDFDocumentProxy, n: number, scale: number) {
  const page = await doc.getPage(n);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const base = page.getViewport({ scale: 1 });
  return { canvas, widthPt: base.width, heightPt: base.height };
}

const canvasToBytes = async (c: HTMLCanvasElement, type: string, q?: number) => {
  const blob: Blob = await new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error('Image export failed'))), type, q)
  );
  return new Uint8Array(await blob.arrayBuffer());
};

/** Re-renders every page as a JPEG inside a new PDF. */
async function rasterizePdf(
  doc: PDFDocumentProxy,
  scale: number,
  quality: number,
  onProgress?: (done: number, total: number) => void
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (let n = 1; n <= doc.numPages; n++) {
    const { canvas, widthPt, heightPt } = await pageToCanvas(doc, n, scale);
    const img = await out.embedJpg(await canvasToBytes(canvas, 'image/jpeg', quality));
    const page = out.addPage([widthPt, heightPt]);
    page.drawImage(img, { x: 0, y: 0, width: widthPt, height: heightPt });
    canvas.width = canvas.height = 0; // release memory
    onProgress?.(n, doc.numPages);
  }
  return out.save();
}

export async function compressPdf(
  file: File,
  mode: 'light' | 'strong',
  quality: number,
  onProgress?: (d: number, t: number) => void
): Promise<OutputFile[]> {
  const buf = await file.arrayBuffer();
  let bytes: Uint8Array;
  if (mode === 'light') {
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    doc.setTitle('');
    doc.setAuthor('');
    doc.setProducer('');
    doc.setCreator('');
    bytes = await doc.save({ useObjectStreams: true });
  } else {
    const doc = await loadPdfDocument(buf);
    bytes = await rasterizePdf(doc, 1.5, quality, onProgress);
  }
  // Never hand back something bigger than the input
  const best = bytes.byteLength < buf.byteLength ? bytes : new Uint8Array(buf);
  return [{ name: `${baseName(file.name)}-compressed.pdf`, blob: pdfBlob(best) }];
}

export async function pdfToImages(
  file: File,
  format: 'jpeg' | 'png',
  scale: number,
  onProgress?: (d: number, t: number) => void
): Promise<OutputFile[]> {
  const doc = await loadPdfDocument(await file.arrayBuffer());
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const base = baseName(file.name);
  const entries: Record<string, Uint8Array> = {};
  for (let n = 1; n <= doc.numPages; n++) {
    const { canvas } = await pageToCanvas(doc, n, scale);
    entries[`${base}-page-${n}.${ext}`] = await canvasToBytes(canvas, `image/${format}`, 0.92);
    canvas.width = canvas.height = 0;
    onProgress?.(n, doc.numPages);
  }
  const names = Object.keys(entries);
  if (names.length === 1) {
    return [{ name: names[0], blob: new Blob([entries[names[0]] as BlobPart], { type: `image/${format}` }) }];
  }
  return [{ name: `${base}-images.zip`, blob: new Blob([zipSync(entries, { level: 0 }) as BlobPart], { type: 'application/zip' }) }];
}

export async function imagesToPdf(files: File[], fit: 'a4' | 'original'): Promise<OutputFile[]> {
  const out = await PDFDocument.create();
  for (const f of files) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const isPng = f.type === 'image/png' || f.name.toLowerCase().endsWith('.png');
    const img = isPng ? await out.embedPng(bytes) : await out.embedJpg(bytes);
    if (fit === 'original') {
      out.addPage([img.width, img.height]).drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    } else {
      const [pw, ph] = img.width > img.height ? [841.89, 595.28] : [595.28, 841.89];
      const margin = 24;
      const s = Math.min((pw - margin * 2) / img.width, (ph - margin * 2) / img.height);
      const w = img.width * s;
      const h = img.height * s;
      out.addPage([pw, ph]).drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
  }
  return [{ name: 'images.pdf', blob: pdfBlob(await out.save()) }];
}

export async function unlockPdf(
  file: File,
  password: string,
  onProgress?: (d: number, t: number) => void
): Promise<OutputFile[]> {
  let doc: PDFDocumentProxy;
  try {
    doc = await loadPdfDocument(await file.arrayBuffer(), password);
  } catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === 'PasswordException') {
      throw new Error(password ? 'Incorrect password' : 'This PDF needs a password');
    }
    throw e;
  }
  const bytes = await rasterizePdf(doc, 2, 0.92, onProgress);
  return [{ name: `${baseName(file.name)}-unlocked.pdf`, blob: pdfBlob(bytes) }];
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function downloadBlob(file: OutputFile) {
  const url = URL.createObjectURL(file.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
