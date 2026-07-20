/**
 * Restrições de upload — módulo ISOMÓRFICO (servidor + navegador).
 * NÃO importar o SDK `cloudinary` aqui: este arquivo é usado no client bundle.
 * Fonte única de verdade para: tipos de upload, MIME permitido, tamanho máximo,
 * pastas por tipo e bloqueio de arquivos perigosos.
 */

export type UploadPurpose =
  | "pet_avatar"
  | "pet_document"
  | "user_avatar"
  | "service_image"
  | "product_image"
  | "partner_logo"
  | "partner_document"
  | "ngo_document"
  | "chat_attachment"
  | "ai_attachment"
  | "social_post_media"
  | "social_profile_avatar"
  | "social_profile_cover";

export const UPLOAD_PURPOSES: UploadPurpose[] = [
  "pet_avatar",
  "pet_document",
  "user_avatar",
  "service_image",
  "product_image",
  "partner_logo",
  "partner_document",
  "ngo_document",
  "chat_attachment",
  "ai_attachment",
  "social_post_media",
  "social_profile_avatar",
  "social_profile_cover",
];

export function isUploadPurpose(value: unknown): value is UploadPurpose {
  return typeof value === "string" && UPLOAD_PURPOSES.includes(value as UploadPurpose);
}

const MB = 1024 * 1024;

/** Pastas restritas por tipo (prefixo no Cloudinary). */
export const PURPOSE_FOLDER: Record<UploadPurpose, string> = {
  user_avatar: "ecopet/profiles",
  social_profile_avatar: "ecopet/profiles",
  social_profile_cover: "ecopet/profiles",
  partner_logo: "ecopet/profiles",
  pet_avatar: "ecopet/pets",
  pet_document: "ecopet/pets",
  product_image: "ecopet/products",
  service_image: "ecopet/products",
  social_post_media: "ecopet/posts",
  partner_document: "ecopet/partners/documents",
  ngo_document: "ecopet/ngos/documents",
  chat_attachment: "ecopet/chat",
  ai_attachment: "ecopet/ai",
};

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const DOC_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** MIME types permitidos por tipo de upload. SVG é bloqueado (vetor de XSS). */
export const ALLOWED_MIME: Record<UploadPurpose, string[]> = {
  pet_avatar: IMAGE_MIME,
  pet_document: DOC_MIME,
  user_avatar: IMAGE_MIME,
  service_image: IMAGE_MIME,
  product_image: IMAGE_MIME,
  partner_logo: IMAGE_MIME,
  partner_document: DOC_MIME,
  ngo_document: DOC_MIME,
  chat_attachment: DOC_MIME,
  ai_attachment: [
    ...DOC_MIME,
    "text/plain",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  social_post_media: IMAGE_MIME,
  social_profile_avatar: IMAGE_MIME,
  social_profile_cover: IMAGE_MIME,
};

/** Limites: imagens até 5 MB; documentos e anexos de chat até 10 MB. */
export const MAX_BYTES: Record<UploadPurpose, number> = {
  pet_avatar: 5 * MB,
  user_avatar: 5 * MB,
  service_image: 5 * MB,
  product_image: 5 * MB,
  partner_logo: 5 * MB,
  social_post_media: 5 * MB,
  social_profile_avatar: 5 * MB,
  social_profile_cover: 5 * MB,
  pet_document: 10 * MB,
  partner_document: 10 * MB,
  ngo_document: 10 * MB,
  chat_attachment: 10 * MB,
  ai_attachment: 10 * MB,
};

/** Extensões permitidas (derivadas dos MIME types). */
const MIME_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
  "text/plain": ["txt"],
  "text/csv": ["csv"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
};

/** Extensões bloqueadas: executáveis, scripts, HTML e formatos perigosos. */
export const DANGEROUS_EXTENSIONS = new Set([
  "exe", "msi", "bat", "cmd", "com", "scr", "pif", "cpl", "dll", "sys",
  "sh", "bash", "zsh", "ps1", "psm1", "vbs", "vbe", "js", "mjs", "cjs",
  "jse", "ts", "jar", "py", "rb", "pl", "php", "phtml", "asp", "aspx",
  "jsp", "htm", "html", "xhtml", "svg", "xml", "wasm", "app", "deb",
  "rpm", "apk", "dmg", "iso", "bin", "run", "gadget", "lnk", "reg",
]);

export function fileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) return "";
  return fileName.slice(idx + 1).toLowerCase();
}

export type UploadValidation = { ok: true } | { ok: false; message: string };

/**
 * Valida um candidato a upload (purpose, MIME, tamanho e extensão).
 * Usado no cliente (antes de pedir a assinatura) e no servidor (na rota).
 */
export function validateUploadCandidate(params: {
  purpose: UploadPurpose;
  mimeType: string;
  sizeBytes: number;
  fileName?: string;
}): UploadValidation {
  const { purpose, mimeType, sizeBytes, fileName } = params;

  if (!isUploadPurpose(purpose)) {
    return { ok: false, message: "Tipo de upload inválido." };
  }
  if (!ALLOWED_MIME[purpose].includes(mimeType)) {
    return { ok: false, message: "Tipo de arquivo não permitido." };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, message: "Arquivo vazio ou inválido." };
  }
  if (sizeBytes > MAX_BYTES[purpose]) {
    const limitMb = Math.round(MAX_BYTES[purpose] / MB);
    return { ok: false, message: `Arquivo excede o tamanho máximo de ${limitMb} MB.` };
  }

  if (fileName) {
    const ext = fileExtension(fileName);
    if (ext && DANGEROUS_EXTENSIONS.has(ext)) {
      return { ok: false, message: "Extensão de arquivo bloqueada por segurança." };
    }
    const allowedExt = ALLOWED_MIME[purpose].flatMap((m) => MIME_EXTENSIONS[m] ?? []);
    if (ext && allowedExt.length > 0 && !allowedExt.includes(ext)) {
      return { ok: false, message: "Extensão não corresponde aos formatos permitidos." };
    }
  }

  return { ok: true };
}

/** resource_type para upload via buffer no servidor (auto na via direta). */
export function resourceTypeForMime(mimeType: string): "image" | "raw" {
  return mimeType === "application/pdf" ? "raw" : "image";
}
