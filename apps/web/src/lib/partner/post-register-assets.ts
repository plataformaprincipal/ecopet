import { uploadFile } from "@/lib/upload/client";
import type { CnpjLookupResult } from "@/lib/integrations/cnpj/types";

export type PartnerDocumentUploadItem = {
  id: string;
  type: string;
  typeLabel: string;
  file: File;
};

export type PartnerVerificationDocument = {
  id: string;
  type: string;
  typeLabel: string;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export async function uploadPartnerRegistrationAssets(params: {
  logoFile?: File | null;
  logoAlt?: string;
  documents: PartnerDocumentUploadItem[];
  cnpjDetails?: CnpjLookupResult | null;
}): Promise<void> {
  let logoUrl: string | undefined;

  if (params.logoFile) {
    try {
      const uploaded = await uploadFile(params.logoFile, "partner_logo");
      logoUrl = uploaded.url;
    } catch {
      /* upload opcional — não bloqueia cadastro */
    }
  }

  const verificationDocuments: PartnerVerificationDocument[] = [];
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

  if (!logoUrl && !verificationDocuments.length && !params.cnpjDetails) return;

  await fetch("/api/partner/register-extras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      logoUrl,
      logoAlt: params.logoAlt,
      verificationDocuments: verificationDocuments.length ? verificationDocuments : undefined,
      cnpjDetails: params.cnpjDetails ?? undefined,
    }),
  });
}
