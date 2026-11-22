'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Download, ArrowUp, ArrowDown, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ToolSlug } from '@/lib/tools/registry';
import {
  rotatePdf, deletePages, addPageNumbers, watermarkPdf, pdfToText, type NumberPosition,
  mergePdfs, splitPdf, compressPdf, pdfToImages, imagesToPdf, unlockPdf,
  countPages, formatBytes, downloadBlob, type OutputFile,
} from '@/lib/tools/ops';

interface Props {
  slug: ToolSlug;
  accept: string;
  multiple: boolean;
}

const ACTION_LABEL: Record<ToolSlug, string> = {
  'merge-pdf': 'Merge PDFs',
  'split-pdf': 'Split PDF',
  'compress-pdf': 'Compress PDF',
  'pdf-to-jpg': 'Convert to images',
  'jpg-to-pdf': 'Create PDF',
  'unlock-pdf': 'Unlock PDF',
  'rotate-pdf': 'Rotate PDF',
  'delete-pdf-pages': 'Delete pages',
  'add-page-numbers': 'Add page numbers',
  'watermark-pdf': 'Add watermark',
  'pdf-to-text': 'Extract text',
};

export function ToolRunner({ slug, accept, multiple }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<OutputFile[]>([]);

  // options
  const [ranges, setRanges] = useState('1-');
  const [splitMode, setSplitMode] = useState<'extract' | 'split'>('extract');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [compressMode, setCompressMode] = useState<'light' | 'strong'>('light');
  const [quality, setQuality] = useState(0.6);
  const [imgFormat, setImgFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [scale, setScale] = useState(2);
  const [fit, setFit] = useState<'a4' | 'original'>('a4');
  const [password, setPassword] = useState('');
  const [angle, setAngle] = useState(90);
  const [rotateRanges, setRotateRanges] = useState('');
  const [deleteRanges, setDeleteRanges] = useState('');
  const [numPos, setNumPos] = useState<NumberPosition>('bottom-center');
  const [numFormat, setNumFormat] = useState<'n' | 'page-n' | 'page-n-of'>('n');
  const [numStart, setNumStart] = useState(1);
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmOpacity, setWmOpacity] = useState(0.25);
  const [wmSize, setWmSize] = useState(64);

  const isAccepted = (f: File) => {
    const exts = accept.split(',').filter((a) => a.startsWith('.'));
    const name = f.name.toLowerCase();
    return exts.some((e) => name.endsWith(e)) || accept.split(',').includes(f.type);
  };

  const addFiles = async (list: FileList | File[]) => {
    const incoming = Array.from(list).filter(isAccepted);
    if (incoming.length === 0) {
      setError('That file type is not supported for this tool.');
      return;
    }
    setError('');
    setResults([]);
    const next = multiple ? [...files, ...incoming] : [incoming[0]];
    setFiles(next);
    if (slug === 'split-pdf') {
      try {
        const n = await countPages(await next[0].arrayBuffer());
        setPageCount(n);
        setRanges(`1-${n}`);
      } catch {
        setPageCount(null);
      }
    }
  };

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= files.length) return;
    const next = [...files];
    [next[i], next[j]] = [next[j], next[i]];
    setFiles(next);
  };

  const run = async () => {
    setBusy(true);
    setError('');
    setResults([]);
    setProgress('');
    const onProgress = (d: number, t: number) => setProgress(`Page ${d} of ${t}`);
    try {
      let out: OutputFile[] = [];
      switch (slug) {
        case 'merge-pdf':
          if (files.length < 2) throw new Error('Add at least two PDFs to merge.');
          out = await mergePdfs(files);
          break;
        case 'split-pdf':
          out = await splitPdf(files[0], ranges, splitMode);
          break;
        case 'compress-pdf':
          out = await compressPdf(files[0], compressMode, quality, onProgress);
          break;
        case 'pdf-to-jpg':
          out = await pdfToImages(files[0], imgFormat, scale, onProgress);
          break;
        case 'jpg-to-pdf':
          out = await imagesToPdf(files, fit);
          break;
        case 'unlock-pdf':
          out = await unlockPdf(files[0], password, onProgress);
          break;
        case 'rotate-pdf':
          out = await rotatePdf(files[0], angle, rotateRanges);
          break;
        case 'delete-pdf-pages':
          out = await deletePages(files[0], deleteRanges);
          break;
        case 'add-page-numbers':
          out = await addPageNumbers(files[0], numPos, numFormat, Math.max(0, Math.floor(numStart) || 1), 12);
          break;
        case 'watermark-pdf':
          out = await watermarkPdf(files[0], wmText, wmOpacity, wmSize);
          break;
        case 'pdf-to-text':
          out = await pdfToText(files[0], onProgress);
          break;
      }
      setResults(out);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Something went wrong. The file may be damaged.');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setError('');
    setPageCount(null);
  };

  const inputCls = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
  const Seg = <T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) => (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${value === v ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const readyToRun = files.length > 0 && !busy;

  return (
    <div className="max-w-3xl mx-auto">
      {files.length === 0 ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          className={`rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${dragOver ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 bg-white/80 hover:border-blue-400'}`}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-lg font-bold text-slate-900">Drop {multiple ? 'files' : 'a file'} here or click to browse</p>
          <p className="text-sm text-slate-500 mt-1">Processed on your device. Nothing is uploaded.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white/90 border border-slate-200 shadow-xl shadow-blue-900/5 p-5 sm:p-6">
          <ul className="divide-y divide-slate-100">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 py-2.5">
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-800" title={f.name}>{f.name}</span>
                <span className="text-xs text-slate-500 shrink-0">{formatBytes(f.size)}</span>
                {multiple && files.length > 1 && (
                  <>
                    <button aria-label="Move up" onClick={() => move(i, -1)} className="p-1 text-slate-400 hover:text-slate-700"><ArrowUp className="w-4 h-4" /></button>
                    <button aria-label="Move down" onClick={() => move(i, 1)} className="p-1 text-slate-400 hover:text-slate-700"><ArrowDown className="w-4 h-4" /></button>
                  </>
                )}
                <button aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, k) => k !== i))} className="p-1 text-slate-400 hover:text-red-600"><X className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
          {multiple && (
            <button onClick={() => inputRef.current?.click()} className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-800">
              + Add more files
            </button>
          )}

          {/* Tool options */}
          <div className="mt-5 space-y-4">
            {slug === 'split-pdf' && (
              <>
                <Seg value={splitMode} onChange={setSplitMode} options={[['extract', 'Extract to one PDF'], ['split', 'Split into files']]} />
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Pages{pageCount ? ` (document has ${pageCount})` : ''}</span>
                  <input value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3, 5, 8-" className={`${inputCls} mt-1`} />
                </label>
              </>
            )}
            {slug === 'compress-pdf' && (
              <>
                <Seg value={compressMode} onChange={setCompressMode} options={[['light', 'Light (keeps text)'], ['strong', 'Strong (images)']]} />
                {compressMode === 'strong' && (
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Quality: {Math.round(quality * 100)}%</span>
                    <input type="range" min={0.3} max={0.9} step={0.05} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-blue-600" />
                  </label>
                )}
              </>
            )}
            {slug === 'pdf-to-jpg' && (
              <div className="flex flex-wrap gap-4">
                <Seg value={imgFormat} onChange={setImgFormat} options={[['jpeg', 'JPG'], ['png', 'PNG']]} />
                <Seg value={String(scale)} onChange={(v) => setScale(+v)} options={[['1', '1x'], ['2', '2x'], ['3', '3x']]} />
              </div>
            )}
            {slug === 'jpg-to-pdf' && (
              <Seg value={fit} onChange={setFit} options={[['a4', 'Fit to A4'], ['original', 'Original size']]} />
            )}
            {slug === 'rotate-pdf' && (
              <>
                <Seg value={String(angle)} onChange={(v) => setAngle(+v)} options={[['90', '90° right'], ['180', '180°'], ['270', '90° left']]} />
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Pages (leave empty for all)</span>
                  <input value={rotateRanges} onChange={(e) => setRotateRanges(e.target.value)} placeholder="2, 4-6" className={`${inputCls} mt-1`} />
                </label>
              </>
            )}
            {slug === 'delete-pdf-pages' && (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Pages to delete</span>
                <input value={deleteRanges} onChange={(e) => setDeleteRanges(e.target.value)} placeholder="1, 3-5" className={`${inputCls} mt-1`} />
              </label>
            )}
            {slug === 'add-page-numbers' && (
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Position</span>
                  <select value={numPos} onChange={(e) => setNumPos(e.target.value as NumberPosition)} className={`${inputCls} mt-1`}>
                    <option value="bottom-center">Bottom center</option>
                    <option value="bottom-right">Bottom right</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="top-center">Top center</option>
                    <option value="top-right">Top right</option>
                    <option value="top-left">Top left</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Format</span>
                  <select value={numFormat} onChange={(e) => setNumFormat(e.target.value as 'n' | 'page-n' | 'page-n-of')} className={`${inputCls} mt-1`}>
                    <option value="n">3</option>
                    <option value="page-n">Page 3</option>
                    <option value="page-n-of">Page 3 of 10</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Start at</span>
                  <input type="number" min={0} value={numStart} onChange={(e) => setNumStart(+e.target.value)} className={`${inputCls} mt-1`} />
                </label>
              </div>
            )}
            {slug === 'watermark-pdf' && (
              <>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Watermark text</span>
                  <input value={wmText} onChange={(e) => setWmText(e.target.value)} className={`${inputCls} mt-1`} />
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Opacity: {Math.round(wmOpacity * 100)}%</span>
                    <input type="range" min={0.05} max={0.8} step={0.05} value={wmOpacity} onChange={(e) => setWmOpacity(+e.target.value)} className="w-full accent-blue-600" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Size: {wmSize}</span>
                    <input type="range" min={24} max={140} step={4} value={wmSize} onChange={(e) => setWmSize(+e.target.value)} className="w-full accent-blue-600" />
                  </label>
                </div>
              </>
            )}
            {slug === 'unlock-pdf' && (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">PDF password</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} mt-1`} autoComplete="off" />
              </label>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={run}
              disabled={!readyToRun}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-blue-700 to-blue-500 text-white font-bold shadow-lg shadow-blue-600/25 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {busy ? (progress || 'Working…') : ACTION_LABEL[slug]}
            </button>
            <button onClick={reset} disabled={busy} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Start over</button>
            <span className="ml-auto text-xs text-slate-400">{files.length} file{files.length > 1 ? 's' : ''} · {formatBytes(totalSize)}</span>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
      />

      <div aria-live="polite">
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {results.length > 0 && (
          <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 animate-pop">
            <p className="flex items-center gap-2 font-bold text-emerald-800 mb-3"><CheckCircle2 className="w-5 h-5" /> Done! Your file is ready.</p>
            {results.map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <button onClick={() => downloadBlob(r)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow">
                  <Download className="w-4 h-4" /> Download
                </button>
                <span className="text-sm text-emerald-900 truncate">{r.name} · {formatBytes(r.blob.size)}{slug === 'compress-pdf' && files[0] ? ` (was ${formatBytes(files[0].size)})` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
