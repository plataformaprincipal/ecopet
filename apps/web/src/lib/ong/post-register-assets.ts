import { uploadFile } from "@/lib/upload/client";

export type OngDocumentUploadItem = {
  id: string;
  type: string;
  typeLabel: string;
  file: File;
};

export type OngVerificationDocument = {
  id: string;
  type: string;
  typeLabel: string;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export async function uploadOngRegistrationAssets(params: {
  profileFile?: File | null;
  coverFile?: File | null;
  logoFile?: File | null;
  documents: OngDocumentUploadItem[];
}): Promise<void> {
  let profileImageUrl: string | undefined;
  let coverImageUrl: string | undefined;
  let logoUrl: string | undefined;

  if (params.profileFile) {
    try {
      const uploaded = await uploadFile(params.profileFile, "partner_logo");
      profileImageUrl = uploaded.url;
    } catch {
      /* upload opcional */
    }
  }

  if (params.coverFile) {
    try {
      const uploaded = await uploadFile(params.coverFile, "partner_logo");
      coverImageUrl = uploaded.url;
    } catch {
      /* upload opcional */
    }
  }

  if (params.logoFile) {
    try {
      const uploaded = await uploadFile(params.logoFile, "partner_logo");
      logoUrl = uploaded.url;
    } catch {
      /* upload opcional */
    }
  }

  const verificationDocuments: OngVerificationDocument[] = [];
  for (const doc of params.documents) {
    try {
      const uploaded = await uploadFile(doc.file, "partner_document");
      verificationDocuments.push({
        id: doc.id,
        type: doc.type,
        typeLabel: doc.typeLabel,
        fileName: doc.file.name,
        url: uploaded.url,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        uploadedAt: new Date().toISOString(),
      });
    } catch {
      /* documento opcional */
    }
  }

  if (!profileImageUrl && !coverImageUrl && !logoUrl && !verificationDocuments.length) return;

  await fetch("/api/ong/register-extras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      profileImageUrl,
      coverImageUrl,
      logoUrl,
      verificationDocuments: verificationDocuments.length ? verificationDocuments : undefined,
    }),
  });
}
