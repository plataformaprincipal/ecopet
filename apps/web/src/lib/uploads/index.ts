/**
 * Canonical upload layer lives in `@/lib/upload`.
 * This folder exists as the stable public path expected by integrations docs
 * (`lib/uploads/*`) without duplicating providers.
 */
export {
  executeUpload,
  resolveUploadProvider,
  type UploadInput,
  type UploadResult,
} from "@/lib/upload/service";

export {
  isCloudinaryConfigured,
  validateUploadFile,
  uploadBuffer,
  type UploadPurpose,
} from "@/lib/upload/cloudinary";

export {
  isDevUploadFallbackEnabled,
  saveLocalDevUpload,
} from "@/lib/upload/local-dev";
