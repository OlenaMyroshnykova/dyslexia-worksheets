// pdf.js
// Turns exercise objects (from generator.js) into printable A4 worksheets.
// Pure client-side via jsPDF, so anyone can build a PDF, take it to a copy
// shop, and work it by hand. Large circles = pencil-friendly tap targets.
//
// Layout follows the edufichas cuaderno style: title block at top, one short
// Spanish instruction, then big rounded items with generous spacing.

import { jsPDF } from 'jspdf';

const A4 = { w: 210, h: 297 }; // mm
const MARGIN = 16;
const CREAM = [250, 249, 244]; // off-white background to cut glare
const INK = [60, 60, 60];
const RULE = [120, 180, 230];

function header(doc, subtitle) {
  // Background tint
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, A4.w, A4.h, 'F');

  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Nombre: .....................   Fecha: ............   Curso: ......', MARGIN, 14);

  doc.setFontSize(18);
  doc.text('Dislexia', MARGIN, 26);
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(subtitle, MARGIN, 32);

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 35, A4.w - MARGIN, 35);
  doc.setTextColor(...INK);
}

function footer(doc) {
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('dyslexia-worksheets · formatos inspirados en edufichas.com', MARGIN, A4.h - 10);
}

function instruction(doc, text, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text(text + ':', MARGIN, y);
}

/* ---- per-type renderers ---- */

function drawFindLetter(doc, ex) {
  instruction(doc, ex.instruction, 46);
  // big target chip
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.8);
  doc.circle(MARGIN + 8, 58, 8);
  doc.setFontSize(22);
  doc.text(String(ex.target), MARGIN + 8, 62, { align: 'center' });

  const startY = 78;
  const cols = 7;
  const gap = (A4.w - 2 * MARGIN) / cols;
  doc.setFontSize(20);
  ex.items.forEach((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + gap * col + gap / 2;
    const y = startY + row * 24;
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.5);
    doc.circle(x, y - 3, 9);
    doc.setTextColor(150, 150, 150);
    doc.text(String(it.glyph), x, y, { align: 'center' });
  });
}

function drawColorLetter(doc, ex) {
  instruction(doc, ex.instruction, 46);
  // key chips
  let kx = MARGIN + 6;
  Object.entries(ex.key).forEach(([glyph, color]) => {
    const rgb = hexToRgb(color);
    doc.setFillColor(...rgb);
    doc.setDrawColor(...INK);
    doc.circle(kx, 58, 7, 'FD');
    doc.setFontSize(18);
    doc.setTextColor(...INK);
    doc.text(glyph, kx, 62, { align: 'center' });
    kx += 22;
  });
  if (ex.ignore) {
    doc.setDrawColor(...INK);
    doc.circle(kx, 58, 7);
    doc.setFontSize(18);
    doc.text(ex.ignore, kx, 62, { align: 'center' });
    doc.setLineWidth(0.8);
    doc.line(kx - 6, 64, kx + 6, 52); // cross-out slash
  }

  const startY = 80;
  const cols = 7;
  const gap = (A4.w - 2 * MARGIN) / cols;
  doc.setFontSize(20);
  ex.items.forEach((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + gap * col + gap / 2;
    const y = startY + row * 24;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.circle(x, y - 3, 9);
    doc.setTextColor(160, 160, 160);
    doc.text(String(it.glyph), x, y, { align: 'center' });
  });
}

function drawGridCount(doc, ex) {
  instruction(doc, ex.instruction, 46);
  const startY = 60;
  const cell = Math.min(26, (A4.w - 2 * MARGIN) / ex.cols);
  const gridW = cell * ex.cols;
  const ox = (A4.w - gridW) / 2;
  doc.setFontSize(20);
  ex.items.forEach((it, i) => {
    const col = i % ex.cols;
    const row = Math.floor(i / ex.cols);
    const x = ox + col * cell;
    const y = startY + row * cell;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.4);
    doc.rect(x, y, cell, cell);
    doc.setTextColor(...INK);
    doc.text(String(it.glyph), x + cell / 2, y + cell / 2 + 3, { align: 'center' });
  });
  const qy = startY + ex.rows * cell + 16;
  doc.setFontSize(14);
  ex.pair.forEach((p, i) => {
    doc.text(`${p}   ¿Cuántas hay? ________`, MARGIN, qy + i * 12);
  });
}

// Render a single glyph (optionally mirrored) as a PNG via an offscreen
// canvas, then place it in the PDF. Canvas flipping is the only reliable way
// to mirror text in jsPDF across environments. Runs in the browser where the
// app lives; falls back to plain text if no canvas is available (e.g. SSR).
function glyphImage(glyph, { mirror = false, size = 96 } = {}) {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#3c3c3c';
  ctx.font = `600 ${Math.round(size * 0.7)}px Lexend, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (mirror) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }
  ctx.fillText(String(glyph), size / 2, size / 2);
  return cv.toDataURL('image/png');
}

function drawCrossReversed(doc, ex) {
  instruction(doc, ex.instruction, 46);
  const startY = 66;
  const cols = 6;
  const gap = (A4.w - 2 * MARGIN) / cols;
  const rowH = 28;
  const box = 16; // mm rendered glyph box
  ex.items.forEach((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = MARGIN + gap * col + gap / 2;
    const cy = startY + row * rowH;
    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.4);
    doc.circle(cx, cy, 11);
    const img = glyphImage(ex.glyph, { mirror: it.reversed });
    if (img) {
      doc.addImage(img, 'PNG', cx - box / 2, cy - box / 2, box, box);
    } else {
      // headless fallback: plain (non-mirrored) text so the file still builds
      doc.setFontSize(28);
      doc.setTextColor(...INK);
      const w = doc.getTextWidth(String(ex.glyph));
      doc.text(String(ex.glyph), cx - w / 2, cy + 4);
    }
  });
}

function drawChooseWord(doc, ex) {
  instruction(doc, ex.instruction, 46);
  let y = 64;
  ex.rows.forEach((r) => {
    // small empty circle the child can mark next to each option
    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.5);
    doc.circle(MARGIN + 6, y - 1.5, 3.2);
    doc.circle(MARGIN + 6, y + 9 - 1.5, 3.2);
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text(r.options[0], MARGIN + 16, y);
    doc.text(r.options[1], MARGIN + 16, y + 9);
    y += 24;
  });
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Rodea la palabra bien escrita en cada pareja.', MARGIN, y + 6);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

const RENDERERS = {
  'find-letter': { draw: drawFindLetter, sub: 'Discriminación visual' },
  'color-letter': { draw: drawColorLetter, sub: 'Colorea por letra' },
  'grid-count': { draw: drawGridCount, sub: 'Cuenta las letras' },
  'cross-reversed': { draw: drawCrossReversed, sub: 'Letras al revés' },
  'choose-word': { draw: drawChooseWord, sub: 'Palabra correcta' },
};

// Build a single- or multi-page PDF from an array of exercise objects.
export function buildPdf(exercises) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  exercises.forEach((ex, idx) => {
    if (idx > 0) doc.addPage();
    const r = RENDERERS[ex.type];
    header(doc, r ? r.sub : 'Dislexia');
    if (r) r.draw(doc, ex);
    footer(doc);
  });
  return doc;
}

export function downloadPdf(exercises, filename = 'fichas-dislexia.pdf') {
  buildPdf(exercises).save(filename);
}
