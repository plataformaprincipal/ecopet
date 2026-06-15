import { v2 as cloudinary } from "cloudinary";

export type UploadPurpose =
  | "pet_avatar"
  | "pet_document"
  | "user_avatar"
  | "service_image"
  | "product_image"
  | "partner_logo"
  | "chat_attachment"
  | "social_post_media"
  | "social_profile_avatar"
  | "social_profile_cover";

const ALLOWED_MIME: Record<UploadPurpose, string[]> = {
  pet_avatar: ["image/jpeg", "image/png", "image/webp"],
  pet_document: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  user_avatar: ["image/jpeg", "image/png", "image/webp"],
  service_image: ["image/jpeg", "image/png", "image/webp"],
  product_image: ["image/jpeg", "image/png", "image/webp"],
  partner_logo: ["image/jpeg", "image/png", "image/webp"],
  chat_attachment: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  social_post_media: ["image/jpeg", "image/png", "image/webp"],
  social_profile_avatar: ["image/jpeg", "image/png", "image/webp"],
  social_profile_cover: ["image/jpeg", "image/png", "image/webp"],
};

const MAX_BYTES: Record<UploadPurpose, number> = {
  pet_avatar: 5 * 1024 * 1024,
  pet_document: 10 * 1024 * 1024,
  user_avatar: 5 * 1024 * 1024,
  service_image: 5 * 1024 * 1024,
  product_image: 5 * 1024 * 1024,
  partner_logo: 5 * 1024 * 1024,
  chat_attachment: 10 * 1024 * 1024,
  social_post_media: 10 * 1024 * 1024,
  social_profile_avatar: 5 * 1024 * 1024,
  social_profile_cover: 8 * 1024 * 1024,
};

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("CLOUDINARY_NOT_CONFIGURED");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function validateUploadFile(
  purpose: UploadPurpose,
  mimeType: string,
  sizeBytes: number
) {
  if (!ALLOWED_MIME[purpose].includes(mimeType)) {
    return { ok: false as const, message: "Tipo de arquivo não permitido." };
  }
  if (sizeBytes > MAX_BYTES[purpose]) {
    return { ok: false as const, message: "Arquivo excede o tamanho máximo." };
  }
  return { ok: true as const };
}

export async function uploadBuffer(params: {
  purpose: UploadPurpose;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  ownerId: string;
}) {
  const check = validateUploadFile(params.purpose, params.mimeType, params.buffer.length);
  if (!check.ok) throw new Error(check.message);

  const cld = getCloudinary();
  const folder = `ecopet/${params.purpose}/${params.ownerId}`;
  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
  }>((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder,
        resource_type: params.mimeType === "application/pdf" ? "raw" : "image",
        public_id: `${Date.now()}-${params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
      },
      (err, res) => {
        if (err || !res) reject(err ?? new Error("Upload falhou"));
        else resolve(res);
      }
    );
    stream.end(params.buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    sizeBytes: result.bytes,
    mimeType: params.mimeType,
  };
}
