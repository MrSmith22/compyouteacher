/**
 * Build a minimal valid PDF containing plain essay text for Module 9 seed uploads.
 * No external PDF library — keeps the seed harness dependency-free.
 */
export function buildDevEssayPdf(text: string): Uint8Array {
  const safe = String(text || "Seeded essay")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "");

  const lines = safe.split("\n").flatMap((line) => {
    const chunks: string[] = [];
    const max = 90;
    for (let i = 0; i < line.length || i === 0; i += max) {
      chunks.push(line.slice(i, i + max) || " ");
      if (line.length === 0) break;
    }
    return chunks;
  }).slice(0, 60);

  const contentLines = ["BT", "/F1 11 Tf", "50 750 Td", "14 TL"];
  lines.forEach((line, index) => {
    if (index === 0) {
      contentLines.push(`(${line}) Tj`);
    } else {
      contentLines.push("T*", `(${line}) Tj`);
    }
  });
  contentLines.push("ET");
  const stream = contentLines.join("\n");

  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj"
  );
  objects.push(
    `4 0 obj<< /Length ${Buffer.byteLength(stream, "utf8")} >>stream\n${stream}\nendstream endobj`
  );
  objects.push(
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj"
  );

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj + "\n";
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;

  return new Uint8Array(Buffer.from(pdf, "utf8"));
}
