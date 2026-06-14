import type { UploadPurpose } from "@/lib/upload/cloudinary";

export type UploadResult = {
  url: string;
  publicId: string;
  sizeBytes: number;
  mimeType: string;
};

export async function uploadFile(file: File, purpose: UploadPurpose): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("purpose", purpose);
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message ?? "Falha no upload.");
  }
  return data.data.upload as UploadResult;
}
