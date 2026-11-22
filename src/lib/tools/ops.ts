'use client';

import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
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

export async function rotatePdf(file: File, angle: number, ranges: string): Promise<OutputFile[]> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const total = doc.getPageCount();
  const targets = ranges.trim() ? new Set(parseRanges(ranges, total).flat()) : new Set(doc.getPageIndices());
  doc.getPages().forEach((p, i) => {
    if (targets.has(i)) p.setRotation(degrees((p.getRotation().angle + angle) % 360));
  });
  return [{ name: `${baseName(file.name)}-rotated.pdf`, blob: pdfBlob(await doc.save()) }];
}

export async function deletePages(file: File, ranges: string): Promise<OutputFile[]> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const remove = [...new Set(parseRanges(ranges, doc.getPageCount()).flat())].sort((a, b) => b - a);
  if (remove.length >= doc.getPageCount()) throw new Error('You cannot delete every page.');
  remove.forEach((i) => doc.removePage(i));
  return [{ name: `${baseName(file.name)}-trimmed.pdf`, blob: pdfBlob(await doc.save()) }];
}

export type NumberPosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

export async function addPageNumbers(
  file: File,
  position: NumberPosition,
  format: 'n' | 'page-n' | 'page-n-of',
  start: number,
  size: number
): Promise<OutputFile[]> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const margin = 28;
  pages.forEach((page, i) => {
    const n = start + i;
    const text = format === 'n' ? `${n}` : format === 'page-n' ? `Page ${n}` : `Page ${n} of ${start + pages.length - 1}`;
    const { width, height } = page.getSize();
    const w = font.widthOfTextAtSize(text, size);
    const [v, h] = position.split('-');
    const x = h === 'left' ? margin : h === 'right' ? width - margin - w : (width - w) / 2;
    const y = v === 'top' ? height - margin - size : margin;
    page.drawText(text, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
  });
  return [{ name: `${baseName(file.name)}-numbered.pdf`, blob: pdfBlob(await doc.save()) }];
}

export async function watermarkPdf(file: File, text: string, opacity: number, size: number): Promise<OutputFile[]> {
  const label = text.trim();
  if (!label) throw new Error('Enter the watermark text.');
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  let w: number;
  try {
    w = font.widthOfTextAtSize(label, size);
  } catch {
    throw new Error('Watermark supports Latin letters, numbers and common punctuation only.');
  }
  const h = size * 0.35;
  const a = (45 * Math.PI) / 180;
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    // Place the text so its centre lands on the page centre after a 45 degree turn
    const x = width / 2 - ((w / 2) * Math.cos(a) - h * Math.sin(a));
    const y = height / 2 - ((w / 2) * Math.sin(a) + h * Math.cos(a));
    page.drawText(label, { x, y, size, font, color: rgb(0.55, 0.55, 0.6), opacity, rotate: degrees(45) });
  }
  return [{ name: `${baseName(file.name)}-watermarked.pdf`, blob: pdfBlob(await doc.save()) }];
}

export async function pdfToText(file: File, onProgress?: (d: number, t: number) => void): Promise<OutputFile[]> {
  const doc = await loadPdfDocument(await file.arrayBuffer());
  const out: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    let line = '';
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) line += '\n';
      else if (line && !line.endsWith('\n') && !line.endsWith(' ') && !item.str.startsWith(' ')) line += ' ';
      line += item.str;
      lastY = y;
    }
    out.push(line.trim());
    onProgress?.(n, doc.numPages);
  }
  const text = out.map((t, i) => `--- Page ${i + 1} ---\n${t}`).join('\n\n');
  if (!out.some((t) => t.length > 0)) {
    throw new Error('No selectable text found. This looks like a scanned PDF (it would need OCR).');
  }
  return [{ name: `${baseName(file.name)}.txt`, blob: new Blob([text], { type: 'text/plain;charset=utf-8' }) }];
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
