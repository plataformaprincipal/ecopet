import { v2 as cloudinary } from "cloudinary";
import {
  PURPOSE_FOLDER,
  resourceTypeForMime,
  validateUploadCandidate,
  type UploadPurpose,
} from "@/lib/storage/upload-constraints";

export type { UploadPurpose } from "@/lib/storage/upload-constraints";

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
  sizeBytes: number,
  fileName?: string
) {
  return validateUploadCandidate({ purpose, mimeType, sizeBytes, fileName });
}

export async function uploadBuffer(params: {
  purpose: UploadPurpose;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  ownerId: string;
}) {
  const check = validateUploadFile(
    params.purpose,
    params.mimeType,
    params.buffer.length,
    params.fileName
  );
  if (!check.ok) throw new Error(check.message);

  const cld = getCloudinary();
  const folder = `${PURPOSE_FOLDER[params.purpose]}/${params.ownerId}`;
  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
    resource_type?: string;
    original_filename?: string;
  }>((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder,
        resource_type: resourceTypeForMime(params.mimeType),
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
    resourceType: result.resource_type ?? resourceTypeForMime(params.mimeType),
    format: result.format,
    originalFilename: result.original_filename ?? params.fileName,
  };
}
