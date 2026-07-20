/**
 * Abstração de processamento de arquivos para IA.
 * Suporta metadados PDF/DOCX/TXT/CSV/XLSX/imagens.
 * NÃO implementa OCR nem visão computacional.
 */
export type AiFileKind = "pdf" | "docx" | "txt" | "csv" | "xlsx" | "image" | "unknown";

const EXT_MAP: Record<string, AiFileKind> = {
  pdf: "pdf",
  docx: "docx",
  doc: "docx",
  txt: "txt",
  csv: "csv",
  xlsx: "xlsx",
  xls: "xlsx",
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
};

const MIME_MAP: Record<string, AiFileKind> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

export function detectAiFileKind(fileName: string, mimeType: string): AiFileKind {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MAP[ext] ?? MIME_MAP[mimeType] ?? "unknown";
}

export type FileProcessingPlan = {
  kind: AiFileKind;
  ocr: "not_implemented";
  vision: "not_implemented";
  textExtraction: "pending" | "supported_plain_text_only";
  readyForExpansion: boolean;
};

/** Plano de processamento futuro — sem OCR/visão nesta etapa. */
export function planFileProcessing(kind: AiFileKind): FileProcessingPlan {
  return {
    kind,
    ocr: "not_implemented",
    vision: "not_implemented",
    textExtraction: kind === "txt" || kind === "csv" ? "supported_plain_text_only" : "pending",
    readyForExpansion: true,
  };
}

/** Extrai texto apenas de TXT/CSV (seguro). Outros tipos: stub. */
export function extractPlainTextIfSupported(
  kind: AiFileKind,
  buffer: Buffer
): { text: string | null; note: string } {
  if (kind === "txt" || kind === "csv") {
    return {
      text: buffer.toString("utf8").slice(0, 20_000),
      note: "Texto extraído sem OCR.",
    };
  }
  return {
    text: null,
    note: "Extração avançada (PDF/DOCX/XLSX/OCR) preparada para módulo futuro.",
  };
}
