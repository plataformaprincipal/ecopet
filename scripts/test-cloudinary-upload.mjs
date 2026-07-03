/**
 * Testes determinísticos da integração Cloudinary (sem rede).
 * Cobrem: validação de MIME/tamanho/extensão, mapa de pastas por tipo,
 * geração de assinatura e validação de variáveis de ambiente.
 *
 * Executar: npm run test:cloudinary
 */
import {
  validateUploadCandidate,
  PURPOSE_FOLDER,
  UPLOAD_PURPOSES,
  ALLOWED_MIME,
  MAX_BYTES,
} from "@/lib/storage/upload-constraints";

let passed = 0;
let failed = 0;
function assert(cond, label) {
  if (cond) {
    passed++;
    console.log(`✓ ${label}`);
  } else {
    failed++;
    console.error(`✗ ${label}`);
  }
}

const MB = 1024 * 1024;

// 1) Validação de candidato ---------------------------------------------------
assert(
  validateUploadCandidate({
    purpose: "user_avatar",
    mimeType: "image/png",
    sizeBytes: 2 * MB,
    fileName: "foto.png",
  }).ok,
  "imagem PNG válida dentro do limite é aceita"
);

assert(
  !validateUploadCandidate({
    purpose: "user_avatar",
    mimeType: "image/png",
    sizeBytes: 6 * MB,
    fileName: "foto.png",
  }).ok,
  "imagem acima de 5 MB é rejeitada"
);

assert(
  !validateUploadCandidate({
    purpose: "product_image",
    mimeType: "application/pdf",
    sizeBytes: 1 * MB,
    fileName: "doc.pdf",
  }).ok,
  "PDF como imagem de produto é rejeitado (MIME)"
);

assert(
  validateUploadCandidate({
    purpose: "partner_document",
    mimeType: "application/pdf",
    sizeBytes: 9 * MB,
    fileName: "contrato.pdf",
  }).ok,
  "PDF de documento até 10 MB é aceito"
);

assert(
  !validateUploadCandidate({
    purpose: "partner_document",
    mimeType: "application/pdf",
    sizeBytes: 11 * MB,
    fileName: "contrato.pdf",
  }).ok,
  "documento acima de 10 MB é rejeitado"
);

assert(
  !validateUploadCandidate({
    purpose: "chat_attachment",
    mimeType: "application/pdf",
    sizeBytes: 1 * MB,
    fileName: "malware.exe",
  }).ok,
  "extensão executável (.exe) é bloqueada"
);

assert(
  !validateUploadCandidate({
    purpose: "user_avatar",
    mimeType: "image/svg+xml",
    sizeBytes: 1024,
    fileName: "logo.svg",
  }).ok,
  "SVG é bloqueado (vetor de XSS)"
);

assert(
  !validateUploadCandidate({
    purpose: "user_avatar",
    mimeType: "text/html",
    sizeBytes: 1024,
    fileName: "page.html",
  }).ok,
  "HTML é bloqueado"
);

assert(
  !validateUploadCandidate({
    purpose: "totally_invalid",
    mimeType: "image/png",
    sizeBytes: 1024,
    fileName: "x.png",
  }).ok,
  "purpose inválido é rejeitado"
);

// 2) Pastas restritas por tipo ------------------------------------------------
const EXPECTED_FOLDERS = {
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
};
for (const [purpose, folder] of Object.entries(EXPECTED_FOLDERS)) {
  assert(PURPOSE_FOLDER[purpose] === folder, `pasta de ${purpose} = ${folder}`);
}

assert(
  UPLOAD_PURPOSES.every((p) => ALLOWED_MIME[p] && MAX_BYTES[p]),
  "todos os purposes têm MIME e limite definidos"
);

// 3) Assinatura segura --------------------------------------------------------
process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
process.env.CLOUDINARY_API_KEY = "123456789";
process.env.CLOUDINARY_API_SECRET = "test-secret-value";

const { createSignedUpload, isCloudinaryConfigured, missingCloudinaryEnv, assertCloudinaryEnv } =
  await import("@/lib/storage/cloudinary");

assert(isCloudinaryConfigured(), "isCloudinaryConfigured true com as 3 variáveis");

const signed = createSignedUpload({ purpose: "pet_avatar", ownerId: "user_abc" });
assert(/^[a-f0-9]{40}$/.test(signed.signature), "assinatura é SHA-1 (40 hex)");
assert(signed.folder === "ecopet/pets/user_abc", "folder inclui purpose + ownerId");
assert(signed.cloudName === "demo-cloud", "cloudName retornado");
assert(signed.apiKey === "123456789", "apiKey retornado");
assert(typeof signed.timestamp === "number", "timestamp numérico");
assert(
  !JSON.stringify(signed).includes("test-secret-value"),
  "API secret NUNCA aparece na resposta"
);

const safeOwner = createSignedUpload({ purpose: "pet_avatar", ownerId: "../../etc/passwd" });
assert(
  !safeOwner.folder.includes(".."),
  "ownerId é sanitizado (sem path traversal)"
);

// 4) Validação de envs ausentes ----------------------------------------------
delete process.env.CLOUDINARY_API_SECRET;
assert(!isCloudinaryConfigured(), "isCloudinaryConfigured false sem o secret");
assert(
  missingCloudinaryEnv().includes("CLOUDINARY_API_SECRET"),
  "missingCloudinaryEnv lista a variável ausente"
);
let threw = false;
try {
  assertCloudinaryEnv();
} catch (e) {
  threw = e instanceof Error && e.message.includes("CLOUDINARY_API_SECRET");
}
assert(threw, "assertCloudinaryEnv lança erro claro citando a variável ausente");

// Resumo ----------------------------------------------------------------------
console.log(`\n${passed} passaram, ${failed} falharam`);
if (failed > 0) process.exit(1);
