/**
 * Módulo central do Cloudinary (SERVIDOR APENAS).
 * Nunca importar este arquivo no client: ele lê CLOUDINARY_API_SECRET.
 *
 * Responsável por:
 *  - configurar o SDK a partir das variáveis de ambiente;
 *  - validar a presença das variáveis com erro claro no servidor;
 *  - gerar assinaturas seguras para upload direto navegador → Cloudinary.
 */
import { v2 as cloudinary } from "cloudinary";
import { PURPOSE_FOLDER, type UploadPurpose } from "@/lib/storage/upload-constraints";

const REQUIRED_ENV = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

export function isCloudinaryConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return REQUIRED_ENV.every((key) => Boolean(env[key]?.trim()));
}

export function missingCloudinaryEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  return REQUIRED_ENV.filter((key) => !env[key]?.trim());
}

/** Lança um erro claro no servidor quando faltam variáveis. */
export function assertCloudinaryEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing = missingCloudinaryEnv(env);
  if (missing.length > 0) {
    throw new Error(
      `Cloudinary não configurado. Variáveis ausentes: ${missing.join(", ")}.`
    );
  }
}

function configured() {
  assertCloudinaryEnv();
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/** Dados públicos seguros (sem o secret) para o cliente. */
export function publicCloudinaryConfig() {
  assertCloudinaryEnv();
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
  };
}

export type SignedUpload = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
};

/**
 * Gera assinatura para upload direto. A pasta é derivada do tipo + dono,
 * impedindo que o cliente escolha um diretório arbitrário.
 */
export function createSignedUpload(params: {
  purpose: UploadPurpose;
  ownerId: string;
}): SignedUpload {
  const cld = configured();
  const { cloudName, apiKey } = publicCloudinaryConfig();

  const safeOwner = params.ownerId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const folder = `${PURPOSE_FOLDER[params.purpose]}/${safeOwner}`;
  const timestamp = Math.round(Date.now() / 1000);

  // Apenas folder + timestamp são assinados; precisam bater exatamente com o
  // que o navegador envia ao Cloudinary (file/api_key/resource_type ficam de fora).
  const signature = cld.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET as string
  );

  return { signature, timestamp, apiKey, cloudName, folder };
}
