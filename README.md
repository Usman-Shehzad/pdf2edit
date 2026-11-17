# PDF2Edit — Secure, Fast & Direct Online PDF Editor

A high-performance in-browser PDF editor built with **Next.js 16 (Turbopack)**, **React 19**, **Tailwind CSS**, **PDF.js**, and **pdf-lib**.

---

## Key Features

- **Direct PDF Editing (No File Conversion)**: Upload `.pdf` documents directly, edit text, draw, sign, and export without converting to Word or rasterized images.
- **Direct In-Place PDF Text Editing**: Click on any existing text inside the PDF to edit it inline in real time with automatic vector matching.
- **100% Client-Side Privacy (Zero-Knowledge)**: Documents are processed entirely in browser memory. No files are uploaded to servers or external databases.
- **Complete Editing Suite**:
  - Direct Text Editing & New Text Insertion
  - Freehand Pen & Semi-transparent Highlighter
  - Shapes (Rectangle, Circle, Line, Arrow)
  - Redaction & Whiteout
  - Digital Signatures (Draw, Type, or Upload)
  - Image & Stamp Insertion
  - Page Management (Rotate, Reorder, Delete, Duplicate, Add Blank Page)
- **High Performance**:
  - 100% local static cMaps and font character sets (zero external CDN network requests).
  - Virtualized lazy rendering via `IntersectionObserver`.
  - Non-blocking decoupled canvas paint pipeline with `React.memo`.

---

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To create an optimized production build:

```bash
npm run build
npm run start
```
