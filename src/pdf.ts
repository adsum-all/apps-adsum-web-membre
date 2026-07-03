// Minimal dependency-free PDF generator for plain-text documents (e.g. the
// hand-signed attestation). Produces a real, multi-page A4 PDF using the
// built-in Courier font (fixed width, so wrapping is exact), returned as a Blob
// so the app can download or print it without ever leaving the page.

const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89; // A4 height in points
const MARGIN = 56;
const FONT_SIZE = 11;
const LINE_H = 15.5;
const CHAR_W = FONT_SIZE * 0.6; // Courier advance width
const TITLE_SIZE = 16;

function escapePdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Wrap text to the printable width, honouring explicit line breaks. */
function wrap(text: string): string[] {
  const maxChars = Math.max(10, Math.floor((PAGE_W - 2 * MARGIN) / CHAR_W));
  const out: string[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    if (raw.length <= maxChars) {
      out.push(raw);
      continue;
    }
    let line = "";
    for (const word of raw.split(" ")) {
      if (word.length > maxChars) {
        if (line) {
          out.push(line);
          line = "";
        }
        for (let i = 0; i < word.length; i += maxChars) out.push(word.slice(i, i + maxChars));
        continue;
      }
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}

/** Latin-1 encode a Courier PDF; non-encodable chars fall back to '?'. */
function toLatin1(s: string): string {
  // Keys use unicode escapes so the source stays ASCII and no dash key collides.
  const map: Record<string, string> = {
    "’": "'",
    "‘": "'",
    "“": '"',
    "”": '"',
    "—": "-",
    "–": "-",
    "…": "...",
    " ": " ",
  };
  // Keep line breaks and tabs (they are handled by wrapping), transliterate a
  // few common punctuation glyphs, drop anything else outside Latin-1.
  return s.replace(/[^\n\r\t -ÿ]/g, (c) => map[c] ?? "?");
}

export function attestationPdf(titre: string, texte: string): Blob {
  const bodyLines = wrap(toLatin1(texte));
  const title = toLatin1(titre);
  const usableH = PAGE_H - 2 * MARGIN - 40; // room for the title on page 1
  const perPage = Math.max(1, Math.floor(usableH / LINE_H));
  const pages: string[][] = [];
  for (let i = 0; i < bodyLines.length; i += perPage) pages.push(bodyLines.slice(i, i + perPage));
  if (pages.length === 0) pages.push([""]);

  const objects: string[] = [];
  const pageObjNums: number[] = [];
  // Reserve: 1 Catalog, 2 Pages, 3 Font. Pages+content start at 4.
  let n = 4;
  pages.forEach((lines, pageIndex) => {
    const contentNum = n++;
    const pageNum = n++;
    pageObjNums.push(pageNum);
    let stream = "BT\n/F1 " + FONT_SIZE + " Tf\n";
    let y = PAGE_H - MARGIN;
    if (pageIndex === 0) {
      stream = "BT\n/F1 " + TITLE_SIZE + " Tf\n" + MARGIN + " " + y + " Td\n(" + escapePdf(title) + ") Tj\nET\n";
      y -= 34;
      stream += "BT\n/F1 " + FONT_SIZE + " Tf\n";
    }
    stream += MARGIN + " " + y + " Td\n";
    lines.forEach((line, i) => {
      if (i > 0) stream += "0 " + -LINE_H + " Td\n";
      stream += "(" + escapePdf(line) + ") Tj\n";
    });
    stream += "ET";
    objects[contentNum] = `${contentNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;
    objects[pageNum] =
      `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj\n`;
  });

  objects[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objects[2] =
    "2 0 obj\n<< /Type /Pages /Kids [" + pageObjNums.map((p) => `${p} 0 R`).join(" ") + `] /Count ${pageObjNums.length} >>\nendobj\n`;
  objects[3] = "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj\n";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < n; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i] ?? "";
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${n}\n0000000000 65535 f \n`;
  for (let i = 1; i < n; i++) {
    pdf += String(offsets[i] ?? 0).padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size ${n} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}

/** Download a Blob as a file, entirely in-app (no navigation, no new tab). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Print a PDF Blob through a hidden iframe, without opening a new page. */
export function printBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.src = url;
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      /* if printing the PDF frame is blocked, the file was still downloadable. */
    }
    window.setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 60000);
  };
  document.body.appendChild(frame);
}
