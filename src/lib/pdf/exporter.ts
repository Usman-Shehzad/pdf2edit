'use client';

import { PDFDocument, rgb, StandardFonts, degrees, LineCapStyle } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { loadPdfDocument, renderPdfPage } from '@/lib/pdf/loader';
import type { Annotation, PageInfo } from '@/types/pdf';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

// Characters WinAnsi (the standard PDF fonts) cannot encode
function needsUnicodeFont(text: string): boolean {
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp > 0xff && !(cp >= 0x2013 && cp <= 0x2026) && cp !== 0x20ac && cp !== 0x2122) return true;
  }
  return false;
}

/**
 * Rasterises a page with redaction boxes burned in, so the covered text/graphics
 * no longer exist anywhere in the output file (unlike a vector rectangle on top).
 */
async function rasterizeRedactedPage(
  pdfjsDoc: Awaited<ReturnType<typeof loadPdfDocument>>,
  sourceIndex: number,
  rotation: number,
  redactions: Extract<Annotation, { type: 'redact' }>[],
  scale = 2.5
): Promise<{ png: Uint8Array; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  const { width, height } = await renderPdfPage(pdfjsDoc, sourceIndex + 1, canvas, scale, rotation);
  const ctx = canvas.getContext('2d')!;
  const ratio = canvas.width / (width / scale); // canvas px per PDF point (includes devicePixelRatio)
  for (const r of redactions) {
    ctx.fillStyle = r.color || '#000000';
    ctx.fillRect(r.x * ratio, r.y * ratio, Math.max(r.width, 2) * ratio, Math.max(r.height, 2) * ratio);
  }
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas export failed'))), 'image/png')
  );
  return { png: new Uint8Array(await blob.arrayBuffer()), width: width / scale, height: height / scale };
}

export async function exportEditedPdf(
  originalArrayBuffer: ArrayBuffer,
  pages: PageInfo[],
  annotations: Annotation[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(originalArrayBuffer.slice(0), {
    ignoreEncryption: true,
  });

  const outputDoc = await PDFDocument.create();
  outputDoc.registerFontkit(fontkit);
  let unicodeFont: Awaited<ReturnType<typeof outputDoc.embedFont>> | null = null;
  const getUnicodeFont = async () => {
    if (!unicodeFont) {
      const bytes = await fetch('/fonts/DejaVuSans.ttf').then((r) => r.arrayBuffer());
      unicodeFont = await outputDoc.embedFont(bytes, { subset: true });
    }
    return unicodeFont;
  };
  let pdfjsDoc: Awaited<ReturnType<typeof loadPdfDocument>> | null = null;

  // Standard fonts
  const helvetica = await outputDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await outputDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await outputDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesRoman = await outputDoc.embedFont(StandardFonts.TimesRoman);
  const courier = await outputDoc.embedFont(StandardFonts.Courier);

  // Group annotations by page
  const annotationsByPage = new Map<number, Annotation[]>();
  for (const ann of annotations) {
    const list = annotationsByPage.get(ann.pageIndex) || [];
    list.push(ann);
    annotationsByPage.set(ann.pageIndex, list);
  }

  for (let i = 0; i < pages.length; i++) {
    const pageMeta = pages[i];
    const pageAnnotations = annotationsByPage.get(i) || [];
    const redactions = pageAnnotations.filter(
      (a): a is Extract<Annotation, { type: 'redact' }> => a.type === 'redact'
    );

    let addedPage;
    let burnedRedactions = false;
    if (pageMeta.isBlank) {
      addedPage = outputDoc.addPage([pageMeta.width, pageMeta.height]);
    } else if (redactions.length > 0) {
      try {
        pdfjsDoc ??= await loadPdfDocument(originalArrayBuffer);
        const r = await rasterizeRedactedPage(pdfjsDoc, pageMeta.originalIndex, pageMeta.rotation, redactions);
        addedPage = outputDoc.addPage([r.width, r.height]);
        const img = await outputDoc.embedPng(r.png);
        addedPage.drawImage(img, { x: 0, y: 0, width: r.width, height: r.height });
        burnedRedactions = true;
      } catch (err) {
        console.error('Secure redaction failed, falling back to overlay:', err);
      }
    }
    if (!addedPage) {
      const [copiedPage] = await outputDoc.copyPages(srcDoc, [pageMeta.originalIndex]);
      if (pageMeta.rotation !== undefined) {
        copiedPage.setRotation(degrees(pageMeta.rotation));
      }
      addedPage = outputDoc.addPage(copiedPage);
    }
    const { width: pageWidth, height: pageHeight } = addedPage.getSize();

    for (const ann of pageAnnotations) {
      try {
        switch (ann.type) {
          case 'text': {
            let font = helvetica;
            const useUnicode = needsUnicodeFont(ann.text);
            if (ann.fontFamily === 'Times-Roman') font = timesRoman;
            else if (ann.fontFamily === 'Courier') font = courier;
            else if (ann.bold) font = helveticaBold;
            else if (ann.italic) font = helveticaOblique;

            // Ensure replacement text is always crisp and visible (never white on white)
            const resolvedColor = (ann.isReplacement && (ann.color === '#ffffff' || !ann.color))
              ? '#000000'
              : (ann.color || '#000000');
            const colorRgb = hexToRgb(resolvedColor);
            const fontSize = ann.fontSize || 16;
            const pdfY = pageHeight - ann.y - fontSize;

            // Direct in-place replacement: cover the original text underneath with whiteout
            if (ann.isReplacement) {
              const coverW = Math.max(ann.coverWidth || ann.width, ann.width, 20) + 4;
              const coverH = Math.max(ann.coverHeight || (fontSize * 1.3), fontSize) + 2;
              addedPage.drawRectangle({
                x: Math.max(0, ann.x - 2),
                y: Math.max(0, pageHeight - ann.y - coverH + 2),
                width: coverW,
                height: coverH,
                color: rgb(1, 1, 1),
                opacity: 1,
              });
            } else if (ann.backgroundColor && ann.backgroundColor !== 'transparent') {
              const bgRgb = hexToRgb(ann.backgroundColor);
              addedPage.drawRectangle({
                x: ann.x - 2,
                y: pdfY - 2,
                width: ann.width + 4,
                height: fontSize + 4,
                color: rgb(bgRgb.r, bgRgb.g, bgRgb.b),
                opacity: 0.7,
              });
            }

            if (useUnicode) font = await getUnicodeFont();
            const lines = ann.text.split('\n');
            lines.forEach((line, lineIdx) => {
              addedPage.drawText(line, {
                x: ann.x,
                y: pdfY - lineIdx * (fontSize * 1.2),
                size: fontSize,
                font: font,
                color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
                opacity: ann.opacity ?? 1,
              });
            });
            break;
          }

          case 'draw':
          case 'highlight': {
            if (!ann.points || ann.points.length < 2) break;
            const strokeRgb = hexToRgb(ann.strokeColor);
            const isHighlighter = ann.type === 'highlight' || ann.isHighlighter;
            const opacity = isHighlighter ? 0.35 : (ann.opacity ?? 1);
            const thickness = ann.strokeWidth || (isHighlighter ? 18 : 2.5);

            for (let p = 0; p < ann.points.length - 1; p++) {
              const p1 = ann.points[p];
              const p2 = ann.points[p + 1];
              addedPage.drawLine({
                start: { x: p1.x, y: pageHeight - p1.y },
                end: { x: p2.x, y: pageHeight - p2.y },
                thickness: thickness,
                lineCap: LineCapStyle.Round,
                color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
                opacity: opacity,
              });
            }
            break;
          }

          case 'rectangle': {
            const strokeRgb = hexToRgb(ann.strokeColor);
            const pdfY = pageHeight - ann.y - ann.height;
            const options: any = {
              x: ann.x,
              y: pdfY,
              width: Math.max(ann.width, 2),
              height: Math.max(ann.height, 2),
              borderColor: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
              borderWidth: ann.strokeWidth || 2,
              opacity: ann.opacity ?? 1,
            };

            if (ann.fillColor && ann.fillColor !== 'transparent') {
              const fillRgb = hexToRgb(ann.fillColor);
              options.color = rgb(fillRgb.r, fillRgb.g, fillRgb.b);
            }

            addedPage.drawRectangle(options);
            break;
          }

          case 'circle': {
            const strokeRgb = hexToRgb(ann.strokeColor);
            const radiusX = Math.max(ann.width / 2, 2);
            const radiusY = Math.max(ann.height / 2, 2);
            const centerX = ann.x + radiusX;
            const centerY = pageHeight - (ann.y + radiusY);

            const options: any = {
              x: centerX,
              y: centerY,
              xScale: radiusX,
              yScale: radiusY,
              borderColor: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
              borderWidth: ann.strokeWidth || 2,
              opacity: ann.opacity ?? 1,
            };

            if (ann.fillColor && ann.fillColor !== 'transparent') {
              const fillRgb = hexToRgb(ann.fillColor);
              options.color = rgb(fillRgb.r, fillRgb.g, fillRgb.b);
            }

            addedPage.drawEllipse(options);
            break;
          }

          case 'line':
          case 'arrow': {
            const strokeRgb = hexToRgb(ann.strokeColor);
            const x1 = ann.x;
            const y1 = pageHeight - ann.y;
            const x2 = ann.endPoint ? ann.endPoint.x : ann.x + ann.width;
            const y2 = ann.endPoint ? pageHeight - ann.endPoint.y : pageHeight - (ann.y + ann.height);

            addedPage.drawLine({
              start: { x: x1, y: y1 },
              end: { x: x2, y: y2 },
              thickness: ann.strokeWidth || 2,
              color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
              opacity: ann.opacity ?? 1,
            });

            if (ann.type === 'arrow') {
              const angle = Math.atan2(y2 - y1, x2 - x1);
              const headLength = 12 + (ann.strokeWidth || 2);
              const angleOffset = Math.PI / 6;

              const arrowP1 = {
                x: x2 - headLength * Math.cos(angle - angleOffset),
                y: y2 - headLength * Math.sin(angle - angleOffset),
              };
              const arrowP2 = {
                x: x2 - headLength * Math.cos(angle + angleOffset),
                y: y2 - headLength * Math.sin(angle + angleOffset),
              };

              addedPage.drawLine({
                start: { x: x2, y: y2 },
                end: arrowP1,
                thickness: ann.strokeWidth || 2,
                color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
              });
              addedPage.drawLine({
                start: { x: x2, y: y2 },
                end: arrowP2,
                thickness: ann.strokeWidth || 2,
                color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
              });
            }
            break;
          }

          case 'redact': {
            if (burnedRedactions) break;
            const colorRgb = hexToRgb(ann.color || '#000000');
            const pdfY = pageHeight - ann.y - ann.height;
            addedPage.drawRectangle({
              x: ann.x,
              y: pdfY,
              width: Math.max(ann.width, 2),
              height: Math.max(ann.height, 2),
              color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
              opacity: 1,
            });
            break;
          }

          case 'image':
          case 'signature': {
            if (!ann.dataUrl) break;
            let imageEmbed;
            if (ann.dataUrl.startsWith('data:image/jpeg') || ann.dataUrl.startsWith('data:image/jpg')) {
              imageEmbed = await outputDoc.embedJpg(ann.dataUrl);
            } else {
              imageEmbed = await outputDoc.embedPng(ann.dataUrl);
            }

            const pdfY = pageHeight - ann.y - ann.height;
            addedPage.drawImage(imageEmbed, {
              x: ann.x,
              y: pdfY,
              width: ann.width,
              height: ann.height,
              opacity: ann.opacity ?? 1,
            });
            break;
          }

          case 'stamp': {
            const colorRgb = hexToRgb(ann.color || '#dc2626');
            const pdfY = pageHeight - ann.y - ann.height;
            const text = ann.label || ann.stampType.toUpperCase();

            addedPage.drawRectangle({
              x: ann.x,
              y: pdfY,
              width: ann.width,
              height: ann.height,
              borderColor: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
              borderWidth: 3,
              color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
              opacity: 0.12,
            });

            addedPage.drawRectangle({
              x: ann.x + 3,
              y: pdfY + 3,
              width: ann.width - 6,
              height: ann.height - 6,
              borderColor: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
              borderWidth: 1.5,
              opacity: 0.9,
            });

            const fontSize = Math.min(ann.height * 0.45, 18);
            const textWidth = helveticaBold.widthOfTextAtSize(text, fontSize);
            const textX = ann.x + (ann.width - textWidth) / 2;
            const textY = pdfY + (ann.height - fontSize) / 2 + 2;

            addedPage.drawText(text, {
              x: Math.max(ann.x + 4, textX),
              y: textY,
              size: fontSize,
              font: helveticaBold,
              color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
            });
            break;
          }
        }
      } catch (err) {
        console.error('Error drawing annotation on export:', ann, err);
      }
    }
  }

  const pdfBytes = await outputDoc.save();
  return pdfBytes;
}
