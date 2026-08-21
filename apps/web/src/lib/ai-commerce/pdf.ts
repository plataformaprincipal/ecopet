/** Gera PDF profissional mínimo (Helvetica) sem dependência externa. */

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(text: string, max = 92): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

export function buildStructuredPdf(params: {
  title: string;
  productName: string;
  petName: string;
  ownerName: string;
  executionId: string;
  createdAt: Date;
  sections: Array<{ heading: string; body: string | string[] }>;
  limitations: string[];
}): Uint8Array {
  const header = [
    "EccoPet",
    params.title,
    `${params.productName}  |  Pet: ${params.petName}  |  Responsavel: ${params.ownerName}`,
    `ID: ${params.executionId}  |  ${params.createdAt.toLocaleString("pt-BR")}`,
    "Documento orientativo. Nao e laudo veterinario, atestado, receita ou parecer medico-veterinario oficial.",
    "",
  ];
  const bodyLines: string[] = [...header];
  for (const section of params.sections) {
    bodyLines.push(section.heading.toUpperCase());
    const raw = Array.isArray(section.body) ? section.body : [section.body];
    for (const line of raw) {
      bodyLines.push(...wrapLine(String(line)));
    }
    bodyLines.push("");
  }
  if (params.limitations.length) {
    bodyLines.push("LIMITACOES");
    for (const line of params.limitations) bodyLines.push(...wrapLine(`- ${line}`));
  }

  const pageHeight = 792;
  const startY = 750;
  const lineHeight = 14;
  const linesPerPage = Math.floor((startY - 50) / lineHeight);
  const pages: string[][] = [];
  for (let i = 0; i < bodyLines.length; i += linesPerPage) {
    pages.push(bodyLines.slice(i, i + linesPerPage));
  }

  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
  const pageIds: number[] = [];
  let nextId = 3;
  const fontId = 1000;
  const contentIds: number[] = [];

  for (const page of pages) {
    const streamLines = ["BT /F1 11 Tf 50 " + startY + " Td"];
    page.forEach((line, idx) => {
      const escaped = pdfEscape(line.slice(0, 120));
      if (idx === 0) streamLines.push(`(${escaped}) Tj`);
      else streamLines.push(`T* (${escaped}) Tj`);
    });
    streamLines.push("ET");
    const stream = streamLines.join("\n");
    const contentId = nextId++;
    contentIds.push(contentId);
    const pageId = nextId++;
    pageIds.push(pageId);
    objects.push(`${contentId} 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj`);
    objects.push(
      `${pageId} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 ${pageHeight}] /Contents ${contentId} 0 R /Resources<< /Font<< /F1 ${fontId} 0 R >> >> >>endobj`
    );
  }
  objects.push(`${fontId} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj`);
  objects.unshift(
    `2 0 obj<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>endobj`
  );

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += obj + "\n";
  }
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
