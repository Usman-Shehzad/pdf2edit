'use client';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function createSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // --- PAGE 1: Consulting Agreement ---
  const page1 = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page1.getSize();

  // Header banner
  page1.drawRectangle({
    x: 40,
    y: height - 100,
    width: width - 80,
    height: 60,
    color: rgb(0.08, 0.18, 0.36),
  });

  page1.drawText('CONFIDENTIAL CONSULTING AGREEMENT', {
    x: 60,
    y: height - 65,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('Document Reference: AGY-2026-X992', {
    x: 60,
    y: height - 85,
    size: 10,
    font: fontRegular,
    color: rgb(0.8, 0.88, 1),
  });

  // Body content
  let cursorY = height - 130;

  page1.drawText('PARTIES TO THIS AGREEMENT', {
    x: 40,
    y: cursorY,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 20;

  const introText = [
    'This Consulting Services Agreement (the "Agreement") is entered into as of November 17, 2026,',
    'by and between Apex Global Solutions Inc. ("Client") and the Undersigned Specialist ("Consultant").',
    'Both parties agree to the terms, conditions, and confidential provisions stated below.',
  ];

  for (const line of introText) {
    page1.drawText(line, {
      x: 40,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    cursorY -= 16;
  }

  cursorY -= 15;

  // Section 1
  page1.drawText('1. SCOPE OF SERVICES & DELIVERABLES', {
    x: 40,
    y: cursorY,
    size: 12,
    font: fontBold,
    color: rgb(0.08, 0.18, 0.36),
  });
  cursorY -= 18;

  const section1Text = [
    'Consultant shall perform professional technical architecture, software verification, and security audits.',
    'Deliverables will be furnished in accordance with milestone schedules agreed upon in Schedule A.',
    'All intellectual property created during the engagement shall remain the sole property of Client.',
  ];

  for (const line of section1Text) {
    page1.drawText(line, {
      x: 40,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    cursorY -= 16;
  }

  cursorY -= 15;

  // Section 2
  page1.drawText('2. COMPENSATION & PAYMENT TERMS', {
    x: 40,
    y: cursorY,
    size: 12,
    font: fontBold,
    color: rgb(0.08, 0.18, 0.36),
  });
  cursorY -= 18;

  // Table header
  page1.drawRectangle({
    x: 40,
    y: cursorY - 6,
    width: width - 80,
    height: 22,
    color: rgb(0.93, 0.95, 0.98),
  });

  page1.drawText('Milestone Description', {
    x: 50,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  page1.drawText('Target Date', {
    x: 340,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  page1.drawText('Amount (USD)', {
    x: 440,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  cursorY -= 26;

  const tableRows = [
    { desc: 'Phase 1: Architecture Review & Security Audit', date: 'Dec 05, 2026', amount: '$ 8,500.00' },
    { desc: 'Phase 2: Core PDF Workflow Implementation', date: 'Dec 22, 2026', amount: '$ 12,000.00' },
    { desc: 'Phase 3: Client Testing, Sign-off & Deployment', date: 'Jan 15, 2027', amount: '$ 6,500.00' },
  ];

  for (const row of tableRows) {
    page1.drawText(row.desc, { x: 50, y: cursorY, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page1.drawText(row.date, { x: 340, y: cursorY, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page1.drawText(row.amount, { x: 440, y: cursorY, size: 9, font: fontBold, color: rgb(0.1, 0.4, 0.2) });

    page1.drawLine({
      start: { x: 40, y: cursorY - 8 },
      end: { x: width - 40, y: cursorY - 8 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    cursorY -= 24;
  }

  cursorY -= 15;

  // Redaction sample area notice
  page1.drawRectangle({
    x: 40,
    y: cursorY - 45,
    width: width - 80,
    height: 55,
    color: rgb(0.99, 0.98, 0.93),
    borderColor: rgb(0.9, 0.75, 0.3),
    borderWidth: 1,
  });

  page1.drawText('SENSITIVE CLAUSE: NON-DISCLOSURE & TRADE SECRETS', {
    x: 55,
    y: cursorY - 12,
    size: 9.5,
    font: fontBold,
    color: rgb(0.5, 0.3, 0.05),
  });

  page1.drawText(
    'Private Internal API Keys and proprietary server addresses: [KEY-9942-SECRET-XQ]',
    { x: 55, y: cursorY - 28, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) }
  );

  page1.drawText('(Tip: Try the Redact / Whiteout tool on this confidential key above!)', {
    x: 55,
    y: cursorY - 40,
    size: 8.5,
    font: fontOblique,
    color: rgb(0.55, 0.4, 0.1),
  });

  cursorY -= 75;

  // Signature Block
  page1.drawText('3. SIGNATURES & ACCEPTANCE', {
    x: 40,
    y: cursorY,
    size: 12,
    font: fontBold,
    color: rgb(0.08, 0.18, 0.36),
  });
  cursorY -= 20;

  // Client signature box
  page1.drawRectangle({
    x: 40,
    y: cursorY - 80,
    width: 240,
    height: 80,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  page1.drawText('CLIENT REPRESENTATIVE', { x: 50, y: cursorY - 18, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
  page1.drawText('Signature:', { x: 50, y: cursorY - 45, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page1.drawText('Date: November 17, 2026', { x: 50, y: cursorY - 70, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  // Consultant signature box (Place for user to sign!)
  page1.drawRectangle({
    x: 315,
    y: cursorY - 80,
    width: 240,
    height: 80,
    borderColor: rgb(0.2, 0.5, 0.9),
    borderWidth: 1.5,
    color: rgb(0.96, 0.98, 1),
  });
  page1.drawText('CONSULTANT (SIGN HERE)', { x: 325, y: cursorY - 18, size: 9, font: fontBold, color: rgb(0.1, 0.3, 0.8) });
  page1.drawText('Click "Signature" tool above to draw or type signature', {
    x: 325,
    y: cursorY - 45,
    size: 8,
    font: fontOblique,
    color: rgb(0.3, 0.5, 0.8),
  });
  page1.drawText('Date: ________________________', { x: 325, y: cursorY - 70, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  // Page 1 footer
  page1.drawText('Page 1 of 2  •  Apex Consulting Agreement', {
    x: 40,
    y: 25,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --- PAGE 2: Security & Terms Appendix ---
  const page2 = doc.addPage([595.28, 841.89]);
  
  page2.drawRectangle({
    x: 40,
    y: height - 70,
    width: width - 80,
    height: 35,
    color: rgb(0.95, 0.96, 0.98),
  });

  page2.drawText('APPENDIX A: SECURITY POLICIES & COMPLIANCE CHECKLIST', {
    x: 55,
    y: height - 52,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  let p2Y = height - 100;
  const checklist = [
    { title: 'Zero Data Transmission', desc: 'All documents are edited 100% locally in user browser RAM.' },
    { title: 'Lossless Vector Preservation', desc: 'No rasterization or conversion to third-party file formats.' },
    { title: 'Client-Side Cryptographic Integrity', desc: 'No remote logging or server upload of file bytes.' },
    { title: 'Direct PDF Spec Conformance', desc: 'Fully compliant ISO 32000 PDF document output.' },
  ];

  for (const item of checklist) {
    page2.drawRectangle({
      x: 45,
      y: p2Y - 3,
      width: 14,
      height: 14,
      borderColor: rgb(0.3, 0.4, 0.6),
      borderWidth: 1.2,
      color: rgb(1, 1, 1),
    });
    page2.drawText(item.title, { x: 70, y: p2Y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    p2Y -= 15;
    page2.drawText(item.desc, { x: 70, y: p2Y, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    p2Y -= 25;
  }

  page2.drawText('Page 2 of 2  •  Apex Consulting Agreement', {
    x: 40,
    y: 25,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await doc.save();
}
