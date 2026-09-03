import "server-only";
import type { HealthCaseKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { executeUpload } from "@/lib/upload/service";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { CatalogCommerceError } from "./checkout";
import { buildIdentifiedPdf } from "./identified-pdf";

const KIND_BY_SKU: Record<string, HealthCaseKind> = {
  "SAU-006": "TRIAGE",
  "SAU-007": "TELEORIENTATION",
  "SAU-008": "TELECONSULT",
  "SAU-009": "SECOND_OPINION",
  "SAU-010": "REPORT",
  "SAU-011": "REPORT",
  "SAU-012": "REPORT",
  "SAU-013": "REPORT",
  "SAU-029": "EXAM_REVIEW",
  "SAU-030": "EXAM_REVIEW",
};

const AI_DISCLAIMER = "IA não emite diagnóstico, laudo, prescrição ou atestado definitivo.";

type AuditTrail = {
  events: Array<{ at: string; action: string; actor: string; detail?: string }>;
  aiDisclaimer: string;
};

function trailOf(value: unknown): AuditTrail {
  const raw = (value ?? {}) as Partial<AuditTrail>;
  return {
    events: Array.isArray(raw.events) ? raw.events : [],
    aiDisclaimer: raw.aiDisclaimer ?? AI_DISCLAIMER,
  };
}

function appendTrail(value: unknown, event: AuditTrail["events"][number]): Prisma.InputJsonValue {
  const current = trailOf(value);
  return {
    ...current,
    events: [...current.events, event].slice(-80),
    aiDisclaimer: AI_DISCLAIMER,
  } as Prisma.InputJsonValue;
}

export function kindForSku(sku: string): HealthCaseKind {
  return KIND_BY_SKU[sku] ?? (sku.startsWith("SAU-") ? "EXAM_REVIEW" : "TRIAGE");
}

export async function createHealthCase(params: {
  userId: string;
  petId: string;
  sku: string;
  intake?: Record<string, unknown>;
}) {
  const pet = await prisma.pet.findFirst({
    where: { id: params.petId, ownerId: params.userId, deletedAt: null },
    select: { id: true },
  });
  if (!pet) throw new CatalogCommerceError("PET_FORBIDDEN", "Pet não encontrado.", 403);
  return prisma.healthClinicalCase.create({
    data: {
      kind: kindForSku(params.sku),
      status: "DRAFT",
      sku: params.sku,
      userId: params.userId,
      petId: pet.id,
      intakeJson: (params.intake ?? {}) as Prisma.InputJsonValue,
      auditTrail: {
        events: [{ at: new Date().toISOString(), action: "CREATED", actor: params.userId }],
        aiDisclaimer: AI_DISCLAIMER,
      },
    },
    include: { documents: true, pet: { select: { id: true, name: true } } },
  });
}

export async function getTutorCase(params: { caseId: string; userId: string }) {
  const row = await prisma.healthClinicalCase.findFirst({
    where: { id: params.caseId, userId: params.userId },
    include: { documents: true, pet: { select: { id: true, name: true } } },
  });
  if (!row) throw new CatalogCommerceError("NOT_FOUND", "Caso não encontrado.", 404);
  return row;
}

export async function listLicensedProfessionals() {
  const rows = await prisma.veterinarianProfile.findMany({
    where: { crmv: { not: "" } },
    select: {
      crmv: true,
      crmvState: true,
      specialties: true,
      onlineAvailable: true,
      user: { select: { id: true, name: true } },
    },
    take: 50,
  });
  return rows
    .filter((r) => Boolean(r.crmv?.trim()))
    .map((r) => ({
      userId: r.user.id,
      name: r.user.name,
      crmv: r.crmv,
      crmvState: r.crmvState,
      specialties: r.specialties,
      onlineAvailable: r.onlineAvailable,
    }));
}

export async function scheduleCase(params: {
  caseId: string;
  userId: string;
  scheduledAt: Date;
  professionalUserId?: string | null;
}) {
  const row = await getTutorCase({ caseId: params.caseId, userId: params.userId });
  let professionalUserId = params.professionalUserId ?? row.professionalUserId;
  if (params.professionalUserId) {
    const licensed = await prisma.veterinarianProfile.findFirst({
      where: { userId: params.professionalUserId, crmv: { not: "" } },
    });
    if (!licensed?.crmv) {
      throw new CatalogCommerceError("PARTNER_REQUIRED", "Profissional sem CRMV cadastrado.", 409);
    }
    professionalUserId = licensed.userId;
  }
  if (!professionalUserId) {
    throw new CatalogCommerceError("PARTNER_REQUIRED", "Não há veterinário habilitado para agendar.", 409);
  }
  return prisma.healthClinicalCase.update({
    where: { id: row.id },
    data: {
      professionalUserId,
      scheduledAt: params.scheduledAt,
      status: row.status === "DRAFT" ? "AWAITING_PAYMENT" : "SCHEDULED",
      auditTrail: appendTrail(row.auditTrail, {
        at: new Date().toISOString(),
        action: "SCHEDULED",
        actor: params.userId,
        detail: params.scheduledAt.toISOString(),
      }),
    },
    include: { documents: true, pet: { select: { id: true, name: true } } },
  });
}

export async function addCaseDocument(params: {
  caseId: string;
  userId: string;
  title: string;
  kind: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const row = await getTutorCase({ caseId: params.caseId, userId: params.userId });
  const uploaded = await executeUpload({
    purpose: "pet_document",
    buffer: params.buffer,
    mimeType: params.mimeType,
    fileName: params.fileName,
    ownerId: params.userId,
  });
  const doc = await prisma.healthClinicalDocument.create({
    data: {
      caseId: row.id,
      kind: params.kind,
      title: params.title,
      storageKey: uploaded.url || uploaded.publicId,
      isFinal: false,
      pdfIdentified: false,
    },
  });
  await prisma.healthClinicalCase.update({
    where: { id: row.id },
    data: {
      auditTrail: appendTrail(row.auditTrail, {
        at: new Date().toISOString(),
        action: "DOCUMENT_UPLOADED",
        actor: params.userId,
        detail: params.title,
      }),
    },
  });
  return doc;
}

export async function attachAiDraft(params: { caseId: string; userId: string; notes?: string }) {
  const row = await getTutorCase({ caseId: params.caseId, userId: params.userId });
  const intake = (row.intakeJson ?? {}) as Record<string, unknown>;
  const organized = {
    notProfessionalDocument: true,
    disclaimer: AI_DISCLAIMER,
    sku: row.sku,
    intake,
    tutorNotes: params.notes ?? "",
    generatedAt: new Date().toISOString(),
  };

  let draft: Record<string, unknown> = {
    ...organized,
    summary: "Histórico organizado automaticamente. Aguardando revisão humana quando o ato veterinário for exigido.",
  };

  if (AI_CONFIG.isConfigured) {
    try {
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: AI_CONFIG.model,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "Você organiza dados clínicos pet para um veterinário humano. NUNCA emita diagnóstico, laudo, prescrição ou atestado. Deixe explícito que o texto é rascunho assistivo.",
          },
          {
            role: "user",
            content: JSON.stringify({ intake, notes: params.notes ?? "", sku: row.sku }).slice(0, 6000),
          },
        ],
      });
      draft = {
        ...organized,
        summary: completion.choices[0]?.message?.content ?? draft.summary,
        model: AI_CONFIG.model,
      };
    } catch {
      draft = { ...draft, openaiUnavailable: true };
    }
  } else {
    draft = { ...draft, openaiUnavailable: true };
  }

  return prisma.healthClinicalCase.update({
    where: { id: row.id },
    data: {
      aiDraftJson: draft as Prisma.InputJsonValue,
      status: row.status === "DRAFT" || row.status === "PAID" ? "AWAITING_PROFESSIONAL" : row.status,
      auditTrail: appendTrail(row.auditTrail, {
        at: new Date().toISOString(),
        action: "AI_DRAFT",
        actor: params.userId,
        detail: "Rascunho assistivo. Não é documento profissional.",
      }),
    },
    include: { documents: true, pet: { select: { id: true, name: true } } },
  });
}

export async function claimCase(params: { caseId: string; professionalUserId: string }) {
  const professional = await prisma.veterinarianProfile.findUnique({
    where: { userId: params.professionalUserId },
  });
  if (!professional?.crmv) {
    throw new CatalogCommerceError("PARTNER_REQUIRED", "Somente veterinário com CRMV pode assumir o caso.", 409);
  }
  const row = await prisma.healthClinicalCase.findFirst({
    where: { id: params.caseId, OR: [{ professionalUserId: null }, { professionalUserId: params.professionalUserId }] },
  });
  if (!row) throw new CatalogCommerceError("NOT_FOUND", "Caso não disponível.", 404);
  return prisma.healthClinicalCase.update({
    where: { id: row.id },
    data: {
      professionalUserId: params.professionalUserId,
      status: row.status === "PAID" || row.status === "AWAITING_PROFESSIONAL" ? "IN_PROGRESS" : row.status,
      crmv: professional.crmv,
      auditTrail: appendTrail(row.auditTrail, {
        at: new Date().toISOString(),
        action: "CLAIMED",
        actor: params.professionalUserId,
        detail: professional.crmv,
      }),
    },
    include: { documents: true, pet: { select: { id: true, name: true } } },
  });
}

async function attachIssuedToHealthProfile(params: {
  userId: string;
  petId: string;
  caseId: string;
  sku: string;
  crmv: string;
  title: string;
}) {
  const existing = await prisma.petHealthProfile.findUnique({ where: { petId: params.petId } });
  const prev = (existing?.lastSummary as Record<string, unknown> | null) ?? {};
  const clinical = Array.isArray(prev.clinicalDocuments) ? (prev.clinicalDocuments as unknown[]) : [];
  const next = {
    ...prev,
    clinicalDocuments: [
      ...clinical,
      {
        caseId: params.caseId,
        sku: params.sku,
        title: params.title,
        crmv: params.crmv,
        issuedAt: new Date().toISOString(),
        provenance: "LICENSED_VETERINARIAN",
        note: AI_DISCLAIMER,
      },
    ],
  };
  if (existing) {
    await prisma.petHealthProfile.update({
      where: { petId: params.petId },
      data: { lastSummary: next as Prisma.InputJsonValue },
    });
    return;
  }
  await prisma.petHealthProfile.create({
    data: {
      petId: params.petId,
      userId: params.userId,
      lastSummary: next as Prisma.InputJsonValue,
    },
  });
}

export async function issueProfessionalDocument(params: {
  caseId: string;
  professionalUserId: string;
  notes: string;
  title: string;
}) {
  const professional = await prisma.veterinarianProfile.findUnique({
    where: { userId: params.professionalUserId },
    include: { user: { select: { name: true } } },
  });
  const crmv = professional?.crmv?.trim() ?? "";
  if (!crmv) {
    throw new CatalogCommerceError(
      "PARTNER_REQUIRED",
      "Teleconsulta, diagnóstico, segunda opinião, laudo, atestado e prescrição definitivos exigem veterinário com CRMV real.",
      409
    );
  }
  const row = await prisma.healthClinicalCase.findFirst({
    where: { id: params.caseId, professionalUserId: params.professionalUserId },
    include: { pet: { select: { name: true } } },
  });
  if (!row) throw new CatalogCommerceError("NOT_FOUND", "Caso não atribuído a este profissional.", 404);

  let storageKey: string | null = null;
  try {
    const pdf = buildIdentifiedPdf({
      title: params.title,
      crmv,
      professionalName: professional!.user.name,
      caseId: row.id,
      sku: row.sku,
      notes: params.notes,
    });
    const uploaded = await executeUpload({
      purpose: "pet_document",
      buffer: pdf,
      mimeType: "application/pdf",
      fileName: `laudo-${row.id}.pdf`,
      ownerId: params.professionalUserId,
    });
    storageKey = uploaded.url || uploaded.publicId;
  } catch {
    storageKey = null;
  }

  const issued = await prisma.healthClinicalCase.update({
    where: { id: row.id },
    data: {
      status: "ISSUED",
      professionalNotes: params.notes,
      crmv,
      issuedAt: new Date(),
      auditTrail: appendTrail(row.auditTrail, {
        at: new Date().toISOString(),
        action: "ISSUED",
        actor: params.professionalUserId,
        detail: crmv,
      }),
    },
    include: { documents: true, pet: { select: { id: true, name: true } } },
  });

  await prisma.healthClinicalDocument.create({
    data: {
      caseId: row.id,
      kind: "LAUDO",
      title: params.title,
      storageKey,
      isFinal: true,
      pdfIdentified: true,
      signedByCrmv: crmv,
    },
  });

  await attachIssuedToHealthProfile({
    userId: row.userId,
    petId: row.petId,
    caseId: row.id,
    sku: row.sku,
    crmv,
    title: params.title,
  });

  return issued;
}
