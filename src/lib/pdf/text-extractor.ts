'use client';

import type { PDFPageProxy } from 'pdfjs-dist';

export interface ExtractedTextItem {
  id: string;
  text: string;
  x: number; // in PDF points (origin top-left)
  y: number; // in PDF points (origin top-left)
  width: number; // in PDF points
  height: number; // in PDF points
  fontSize: number;
  fontFamily: string;
  color?: string;
}

/**
 * Extracts and groups text items from a PDF.js page using viewport coordinate transformation.
 * Accurately calculates screen coordinates regardless of page rotation or offsets.
 */
export async function extractPageTextItems(
  page: PDFPageProxy,
  rotation: number = 0
): Promise<ExtractedTextItem[]> {
  try {
    const viewport = page.getViewport({ scale: 1.0, rotation });
    const textContent = await page.getTextContent();
    const rawItems = textContent.items as any[];

    if (!rawItems || rawItems.length === 0) return [];

    const items: ExtractedTextItem[] = [];

    for (let idx = 0; idx < rawItems.length; idx++) {
      const item = rawItems[idx];
      if (!item.str || item.str.trim().length === 0 || !item.transform) continue;

      // item.transform: [scaleX, skewY, skewX, scaleY, transX, transY]
      const tx = item.transform[4];
      const ty = item.transform[5];

      // Use viewport.convertToViewportPoint for 100% accurate top-left coordinates
      const [vx, vy] = viewport.convertToViewportPoint(tx, ty);

      // Font size derived from transform matrix
      const fontSize = Math.max(
        Math.round(Math.hypot(item.transform[2], item.transform[3])),
        Math.round(Math.abs(item.transform[0])),
        Math.round(item.height || 12)
      );

      // vy is baseline Y from top; top of text box is baselineY - fontSize
      const x = Math.max(0, Math.round(vx));
      const y = Math.max(0, Math.round(vy - fontSize));
      const width = Math.max(Math.round(item.width), 12);
      const height = Math.max(Math.round(fontSize * 1.25), 12);

      items.push({
        id: `extracted-${idx}`,
        text: item.str,
        x,
        y,
        width,
        height,
        fontSize,
        fontFamily: item.fontName || 'Helvetica',
      });
    }

    // Sort items top-to-bottom, then left-to-right
    items.sort((a, b) => {
      const yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 5) {
        return yDiff;
      }
      return a.x - b.x;
    });

    // Group adjacent items on the same line into natural sentences/blocks
    const grouped: ExtractedTextItem[] = [];
    let current: ExtractedTextItem | null = null;

    for (const item of items) {
      if (!current) {
        current = { ...item };
        continue;
      }

      const sameLine = Math.abs(current.y - item.y) <= 4;
      const nearbyX = item.x >= current.x && item.x <= current.x + current.width + 16;

      if (sameLine && nearbyX) {
        // Append text with spacer if needed
        const gap = item.x - (current.x + current.width);
        const spacer = gap > 2 ? ' ' : '';
        current.text = current.text + spacer + item.text;
        current.width = Math.round(item.x + item.width - current.x);
        current.height = Math.max(current.height, item.height);
      } else {
        grouped.push(current);
        current = { ...item };
      }
    }

    if (current) {
      grouped.push(current);
    }

    return grouped;
  } catch (err) {
    console.error('Failed to extract text from page:', err);
    return [];
  }
}
