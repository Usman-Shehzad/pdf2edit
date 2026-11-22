export type ToolSlug =
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'pdf-to-jpg'
  | 'jpg-to-pdf'
  | 'unlock-pdf';

export interface ToolMeta {
  slug: ToolSlug;
  name: string;
  /** Short card blurb */
  tagline: string;
  /** <title> and H1 */
  title: string;
  description: string;
  keywords: string[];
  tone: string; // tailwind gradient classes
  accept: string;
  multiple: boolean;
  faq: { q: string; a: string }[];
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    tagline: 'Combine several PDFs into one, in the order you choose.',
    title: 'Merge PDF Files Online – Free & Private',
    description:
      'Combine multiple PDF files into a single document in your browser. No upload, no sign-up, no watermark.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'pdf merger'],
    tone: 'from-blue-600 to-cyan-500',
    accept: 'application/pdf,.pdf',
    multiple: true,
    faq: [
      { q: 'Are my files uploaded?', a: 'No. Merging happens entirely in your browser, so your documents never leave your device.' },
      { q: 'Can I change the order?', a: 'Yes. Use the arrows next to each file to reorder before merging.' },
      { q: 'Is there a file limit?', a: 'There is no fixed limit, but very large files are bounded by your device memory.' },
    ],
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    tagline: 'Extract pages or split a PDF into separate files.',
    title: 'Split PDF – Extract Pages Online, Free & Private',
    description:
      'Split a PDF by page ranges or into single pages, or extract selected pages into a new file. Runs in your browser.',
    keywords: ['split pdf', 'extract pdf pages', 'separate pdf pages', 'pdf splitter'],
    tone: 'from-indigo-500 to-violet-500',
    accept: 'application/pdf,.pdf',
    multiple: false,
    faq: [
      { q: 'How do I enter page ranges?', a: 'Use commas and dashes, for example 1-3, 5, 8-. An open end like 8- means "to the last page".' },
      { q: 'What is the difference between the modes?', a: '"Extract" puts the chosen pages in one new PDF. "Split" makes one file per range, downloaded as a ZIP.' },
    ],
  },
  {
    slug: 'compress-pdf',
    name: 'Compress PDF',
    tagline: 'Make PDFs smaller for email and uploads.',
    title: 'Compress PDF – Reduce File Size Online, Free & Private',
    description:
      'Reduce PDF file size right in your browser. Choose a light clean-up that keeps text, or strong compression for scans.',
    keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'pdf compressor'],
    tone: 'from-emerald-500 to-teal-500',
    accept: 'application/pdf,.pdf',
    multiple: false,
    faq: [
      { q: 'Which mode should I use?', a: 'Light keeps text selectable but saves less. Strong converts pages to compressed images, which saves the most on scans and photo-heavy files but makes text non-selectable.' },
      { q: 'Will quality drop?', a: 'Light mode does not change page content. Strong mode trades some sharpness for size; pick the quality that suits you.' },
    ],
  },
  {
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    tagline: 'Turn every PDF page into an image.',
    title: 'PDF to JPG / PNG – Convert Pages to Images Online',
    description:
      'Convert PDF pages to high-quality JPG or PNG images in your browser. Download all pages as a ZIP.',
    keywords: ['pdf to jpg', 'pdf to png', 'convert pdf to image', 'pdf to image'],
    tone: 'from-amber-500 to-orange-500',
    accept: 'application/pdf,.pdf',
    multiple: false,
    faq: [
      { q: 'What resolution do I get?', a: 'Choose 1x, 2x or 3x. 2x is about 144 DPI and a good default.' },
    ],
  },
  {
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    tagline: 'Combine photos and scans into one PDF.',
    title: 'JPG / PNG to PDF – Convert Images to PDF Online',
    description:
      'Turn JPG and PNG images into a single PDF in your browser. Reorder, fit to A4 or keep original size.',
    keywords: ['jpg to pdf', 'png to pdf', 'image to pdf', 'photos to pdf'],
    tone: 'from-pink-500 to-rose-500',
    accept: 'image/jpeg,image/png,.jpg,.jpeg,.png',
    multiple: true,
    faq: [
      { q: 'Which formats work?', a: 'JPG and PNG. Convert other formats such as HEIC to JPG first.' },
    ],
  },
  {
    slug: 'unlock-pdf',
    name: 'Unlock PDF',
    tagline: 'Remove the password from a PDF you own.',
    title: 'Unlock PDF – Remove PDF Password Online (Private)',
    description:
      'Open a password-protected PDF with the password you know and save an unlocked copy. Nothing is uploaded.',
    keywords: ['unlock pdf', 'remove pdf password', 'decrypt pdf'],
    tone: 'from-slate-600 to-slate-800',
    accept: 'application/pdf,.pdf',
    multiple: false,
    faq: [
      { q: 'Can you crack a forgotten password?', a: 'No. You need the correct password. This tool only removes protection from files you are allowed to open.' },
      { q: 'Is the text still selectable?', a: 'The unlocked copy is made of page images so it works with every PDF. Text will not be selectable.' },
    ],
  },
];

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);
