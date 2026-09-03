/** PDF mínimo identificado (não é assinatura ICP-Brasil). */

function escapePdf(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "?");
}

export function buildIdentifiedPdf(params: {
  title: string;
  crmv: string;
  professionalName: string;
  caseId: string;
  sku: string;
  notes: string;
}): Buffer {
  const header = [
    "ECCOPET - DOCUMENTO IDENTIFICADO",
    params.title.slice(0, 80),
    `CRMV: ${params.crmv}`,
    `Profissional: ${params.professionalName.slice(0, 60)}`,
    `Caso: ${params.caseId}`,
    `SKU: ${params.sku}`,
    "IA nao emite laudo, diagnostico, prescricao ou atestado definitivo.",
    "Este PDF identifica o profissional habilitado. Nao substitui assinatura ICP-Brasil.",
    "---",
  ];
  const body = params.notes.replace(/\s+/g, " ").slice(0, 1200);
  const wrapped: string[] = [];
  for (let i = 0; i < body.length; i += 86) wrapped.push(body.slice(i, i + 86));
  const lines = [...header, ...wrapped].slice(0, 40);

  let ops = "";
  let y = 760;
  for (const line of lines) {
    const font = y > 730 ? 12 : 10;
    ops += `BT /F1 ${font} Tf 48 ${y} Td (${escapePdf(line)}) Tj ET\n`;
    y -= 16;
  }

  const stream = ops;
  const streamLen = Buffer.byteLength(stream, "utf8");
  const parts = [
    "%PDF-1.4\n",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${streamLen} >> stream\n${stream}endstream\nendobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];

  const offsets: number[] = [];
  let cursor = 0;
  const chunks: Buffer[] = [];
  for (const part of parts) {
    offsets.push(cursor);
    const buf = Buffer.from(part, "utf8");
    chunks.push(buf);
    cursor += buf.length;
  }
  const xrefStart = cursor;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.concat([...chunks, Buffer.from(xref, "utf8"), Buffer.from(trailer, "utf8")]);
}
