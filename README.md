# PDF2Edit — Fast, Private & Direct Online PDF Editor

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3.3-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-emerald?style=flat-square)](#)

A high-performance in-browser PDF editor that allows users to upload, edit, sign, annotate, redact, and reorganize PDF documents **directly in the browser without any file conversion**.

---

## Table of Contents

- [About PDF2Edit](#about-pdf2edit)
- [Key Features](#key-features)
- [Major Advantages](#major-advantages)
- [Comprehensive Toolset](#comprehensive-toolset)
- [Security & Privacy Architecture](#security--privacy-architecture)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

---

## About PDF2Edit

Most conventional online PDF editors require documents to be uploaded to a remote server, converted into Word (`.docx`) or rasterized image formats (`.png`/`.jpg`), edited, and then re-converted back into a PDF. This traditional approach has severe drawbacks:

1. **Privacy & Security Risks**: Confidential files (contracts, medical records, financial statements, tax forms, IDs) are stored on third-party servers.
2. **Broken Formatting**: Converting from PDF to Word or images destroys vector sharpness, ruins font metrics, and creates misalignment.
3. **Sluggish Performance**: Conversion pipelines introduce latency and consume significant server bandwidth.

**PDF2Edit solves this entirely by running 100% on the client side.** Using Mozilla's `PDF.js` for rendering and `pdf-lib` for direct binary manipulation, documents never leave your device's memory. Every modification is baked directly into the PDF's native vector streams with zero format conversion.

---

## Key Features

### 1. Direct In-Place PDF Text Editing
- **Click-to-Edit Any Existing Text**: Click any text line or heading directly on the PDF page. It transforms into an inline editor right where the text sits.
- **Instant Typography Matching**: Font sizes, line baselines, and position coordinates are automatically calculated from the PDF's internal character stream.
- **Seamless Vector Replacement**: When saved, the original text is masked with a vector cover and your new text is written in crisp, high-resolution vector typography.

### 2. Digital Signatures & Approvals
- **Draw Signature**: Interactive signature pad with curve smoothing, clear button, and color selection (Black, Navy Blue, Dark Red).
- **Type Signature**: Digital handwriting generator offering elegant cursive and formal script styles.
- **Upload Signature**: Upload transparent PNG or JPG signature scans and place them anywhere on the document.

### 3. Redaction & Whiteout (Privacy Shield)
- Block out sensitive data, proprietary secrets, private keys, Social Security numbers, or confidential values.
- Choose between **Blackout** (opaque black security bars) and **Whiteout** (blank vector fill to cleanly erase content).

### 4. Vector Drawings & Annotations
- **Freehand Pen**: Smooth sketch and handwriting pen with adjustable stroke width and colors.
- **Translucent Highlighter**: Text highlighter with bright preset colors (Yellow, Green, Sky Blue, Pink, Orange) for emphasizing key clauses without obscuring text.
- **Geometric Shapes**: Rectangles, circles/ellipses, straight lines, and directional arrows with custom border weights and fill colors.

### 5. Logos, Stamps & Seals
- **Custom Image Insertion**: Upload company logos, official stamps, screenshots, or diagrams directly onto any page.
- **Built-in Status Badges**: One-click official status stamps including `APPROVED`, `CONFIDENTIAL`, `URGENT`, and `DRAFT`.

### 6. Full Page Organization
- **Interactive Thumbnails Sidebar**: Visual previews for every page in the document.
- **Page Operations**: Rotate pages (90° / 180° / 270°), reorder pages up/down, duplicate pages, delete pages, or insert clean blank pages.

### 7. Instant Lossless PDF Download
- Generates fully compliant ISO 32000 PDF documents in browser RAM.
- Original text remains selectable, searchable, and crisp on export.

---

## Major Advantages

| Advantage | PDF2Edit | Traditional Online PDF Tools |
| :--- | :--- | :--- |
| **Data Privacy** | **100% Client-Side** — Files never leave your browser RAM | Uploaded to remote servers / cloud databases |
| **File Conversion** | **Zero Conversion** — Edits native PDF binary directly | Converts to DOCX/HTML/Images first, then back |
| **Text Quality** | **Lossless Vector Quality** — Text remains crisp at any zoom | Often rasterizes or distorts layout and fonts |
| **Searchability** | **Searchable** — Preserves text structure | Often flattens text into unsearchable images |
| **Offline Support** | **Works 100% Offline** — Local static character sets | Fails completely without active server connection |
| **Server Cost** | **Zero Server Load** — Client-side execution | Requires expensive backend GPU/CPU compute |
| **Compliance** | **GDPR & HIPAA Friendly by Design** | High compliance & data leak liability |

---

## Comprehensive Toolset

| Tool | Shortcut | Description |
| :--- | :---: | :--- |
| **Select / Move** | `V` / `Esc` | Select, reposition, or resize annotations on any page |
| **Edit PDF Text** | `E` | Direct in-place editing of existing text in the document |
| **Add Text** | `T` | Click anywhere to add a new customizable text block |
| **Freehand Pen** | `P` | Draw notes, signatures, or freehand sketches |
| **Highlighter** | `H` | Semi-transparent highlight over text and figures |
| **Rectangle** | `R` | Draw outlined or filled rectangular boxes |
| **Circle** | `C` | Draw circles and ellipses |
| **Redact** | `X` | Conceal confidential information with black or white fill |
| **Signature** | `S` | Draw, type, or upload reusable digital signatures |
| **Image** | — | Insert custom images, logos, and digital stamps |
| **Stamp** | — | Place pre-configured approval and confidentiality stamps |
| **Undo / Redo** | `Ctrl + Z` / `Ctrl + Y` | Multi-step history stack |
| **Zoom In / Out** | `Ctrl +` / `Ctrl -` | Zoom viewport from 50% to 300% with high-DPI scaling |

---

## Security & Privacy Architecture

PDF2Edit operates under a **Zero-Knowledge Architecture**:

1. **Local Memory Isolation**: When a PDF is selected, it is loaded into the browser's JavaScript `ArrayBuffer`. At no point is a network request sent containing file bytes.
2. **Local Static Assets**: Mozilla PDF.js character maps (`/cmaps/`) and standard font definitions (`/standard_fonts/`) are served directly from the local static directory, eliminating external third-party CDN leaks.
3. **No Cookies or Tracking**: No user document telemetry, analytics, or session logging is collected.

---

## Technology Stack

- **Framework**: [Next.js 16.4.6](https://nextjs.org/) (Turbopack engine, App Router)
- **UI Library**: [React 19.3.0](https://react.dev/)
- **Styling**: [Tailwind CSS 4.3.3](https://tailwindcss.com/)
- **PDF Viewing Engine**: [PDF.js 3.11.174](https://mozilla.github.io/pdf.js/) (Local Worker & cMaps)
- **PDF Binary Engine**: [pdf-lib](https://pdf-lib.js.org/) & [@pdf-lib/fontkit](https://github.com/Hopding/pdf-lib)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript 5

---

## Getting Started

### Prerequisites
- Node.js 18.18+ or later
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Usman-Shehzad/pdf2edit.git
   cd pdf2edit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Production Build

To build the project for production deployment:

```bash
npm run build
npm run start
```

---

## Project Structure

```
pdf2edit/
├── public/
│   ├── cmaps/                # Local PDF character maps (zero CDN latency)
│   ├── standard_fonts/       # Local standard font definitions
│   └── pdf.worker.min.js     # PDF.js Web Worker script
├── src/
│   ├── app/
│   │   ├── globals.css       # Tailwind CSS styles
│   │   ├── layout.tsx        # Application root layout
│   │   └── page.tsx          # Dynamic SSR-safe entry point
│   ├── components/pdf/
│   │   ├── PdfDropzone.tsx   # Drag-and-drop file upload screen
│   │   ├── PdfEditor.tsx     # Master editor workbench & state machine
│   │   ├── PdfToolbar.tsx    # Tool selector & property sub-toolbar
│   │   ├── PdfPageCanvas.tsx # Individual page canvas & interactive overlay
│   │   ├── PdfPageThumbnailSidebar.tsx # Thumbnails & page management
│   │   ├── PdfSignatureModal.tsx       # Signature drawing & typing modal
│   │   ├── PdfImageModal.tsx           # Custom image & logo modal
│   │   ├── PdfShortcutsModal.tsx       # Keyboard shortcuts guide
│   │   └── PdfSecurityBadge.tsx        # Security & privacy badge
│   ├── lib/pdf/
│   │   ├── loader.ts         # PDF.js loader with lazy rendering
│   │   ├── exporter.ts       # pdf-lib binary injection engine
│   │   ├── sample-pdf.ts     # Built-in sample agreement generator
│   │   └── text-extractor.ts # Viewport text extraction for in-place edit
│   └── types/
│       └── pdf.ts            # TypeScript interfaces & definitions
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies & scripts
└── tsconfig.json             # TypeScript configuration
```

---

## License

This project is licensed under the [MIT License](LICENSE).
