import "server-only";

import { prisma } from "@/lib/prisma";
import { getMercadoPagoPaymentMethods, getMercadoPagoInstallments } from "@/lib/mercado-pago/client";
import { isMercadoPagoConfigured } from "@/lib/mercado-pago/config";

export type EcoPetPaymentMethodId = "credit_card" | "debit_card" | "pix" | "boleto";

const METHOD_MAP: Record<
  EcoPetPaymentMethodId,
  { displayName: string; mpPaymentTypeIds: string[]; mpIds: string[] }
> = {
  credit_card: {
    displayName: "Cartão de crédito",
    mpPaymentTypeIds: ["credit_card"],
    mpIds: [],
  },
  debit_card: {
    displayName: "Cartão de débito",
    mpPaymentTypeIds: ["debit_card"],
    mpIds: [],
  },
  pix: {
    displayName: "Pix",
    mpPaymentTypeIds: ["bank_transfer"],
    mpIds: ["pix"],
  },
  boleto: {
    displayName: "Boleto bancário",
    mpPaymentTypeIds: ["ticket"],
    mpIds: ["bolbradesco", "boleto", "pec"],
  },
};

function detectSupported(methods: Array<Record<string, unknown>>): Record<EcoPetPaymentMethodId, boolean> {
  const result: Record<EcoPetPaymentMethodId, boolean> = {
    credit_card: false,
    debit_card: false,
    pix: false,
    boleto: false,
  };

  for (const m of methods) {
    const id = String(m.id ?? "").toLowerCase();
    const type = String(m.payment_type_id ?? "").toLowerCase();
    const status = String(m.status ?? "active").toLowerCase();
    if (status && status !== "active") continue;

    if (type === "credit_card") result.credit_card = true;
    if (type === "debit_card") result.debit_card = true;
    if (id === "pix" || (type === "bank_transfer" && id.includes("pix"))) result.pix = true;
    if (type === "ticket" || METHOD_MAP.boleto.mpIds.includes(id)) result.boleto = true;
  }
  return result;
}

/**
 * Sincroniza meios da conta MP com PaymentMethodConfiguration.
 * Admin só pode habilitar métodos com supportedByAccount=true.
 */
export async function syncPaymentMethodConfigurations(actorId?: string) {
  if (!isMercadoPagoConfigured()) {
    return { ok: false as const, code: "MP_NOT_CONFIGURED", methods: [] as never[] };
  }

  const remote = await getMercadoPagoPaymentMethods();
  if (!remote.ok) {
    return { ok: false as const, code: remote.code, methods: [] as never[] };
  }

  const supported = detectSupported(remote.data || []);
  const now = new Date();
  const rows = [];

  for (const methodId of Object.keys(METHOD_MAP) as EcoPetPaymentMethodId[]) {
    const def = METHOD_MAP[methodId];
    const supportedByAccount = supported[methodId];
    const row = await prisma.paymentMethodConfiguration.upsert({
      where: { methodId },
      create: {
        methodId,
        displayName: def.displayName,
        enabled: supportedByAccount,
        supportedByAccount,
        lastCheckedAt: now,
        updatedById: actorId,
      },
      update: {
        displayName: def.displayName,
        supportedByAccount,
        lastCheckedAt: now,
        // Se a conta deixou de suportar, força disable
        ...(supportedByAccount ? {} : { enabled: false }),
        updatedById: actorId,
      },
    });
    rows.push(row);
  }

  return { ok: true as const, methods: rows };
}

/** Meios ativos para o checkout (supported + enabled). */
export async function getActiveCheckoutPaymentMethods() {
  let rows = await prisma.paymentMethodConfiguration.findMany({
    orderBy: { methodId: "asc" },
  });
  if (rows.length === 0 && isMercadoPagoConfigured()) {
    const synced = await syncPaymentMethodConfigurations();
    if (synced.ok) rows = synced.methods;
  }
  return rows
    .filter((r) => r.enabled && r.supportedByAccount)
    .map((r) => ({
      methodId: r.methodId as EcoPetPaymentMethodId,
      displayName: r.displayName,
    }));
}

export async function setPaymentMethodEnabled(input: {
  methodId: string;
  enabled: boolean;
  actorId: string;
}) {
  const row = await prisma.paymentMethodConfiguration.findUnique({
    where: { methodId: input.methodId },
  });
  if (!row) return { ok: false as const, code: "NOT_FOUND", message: "Método não encontrado." };
  if (input.enabled && !row.supportedByAccount) {
    return {
      ok: false as const,
      code: "NOT_SUPPORTED",
      message: "A conta Mercado Pago não suporta este método.",
    };
  }
  const updated = await prisma.paymentMethodConfiguration.update({
    where: { methodId: input.methodId },
    data: { enabled: input.enabled, updatedById: input.actorId },
  });
  return { ok: true as const, method: updated };
}

export async function fetchOfficialInstallments(params: {
  amount: number;
  bin?: string;
  paymentMethodId?: string;
}) {
  if (!isMercadoPagoConfigured()) {
    return { ok: false as const, code: "MP_NOT_CONFIGURED", options: [] as never[] };
  }
  if (!(params.amount > 0)) {
    return { ok: false as const, code: "INVALID_AMOUNT", options: [] as never[] };
  }
  const res = await getMercadoPagoInstallments(params);
  if (!res.ok) return { ok: false as const, code: res.code, options: [] as never[] };

  const raw = Array.isArray(res.data) ? res.data : [];
  const first = raw[0] as { payer_costs?: Array<Record<string, unknown>> } | undefined;
  const costs = first?.payer_costs ?? [];
  const options = costs.map((c) => ({
    installments: Number(c.installments ?? 1),
    installmentAmount: Number(c.installment_amount ?? 0),
    totalAmount: Number(c.total_amount ?? params.amount),
    recommendedMessage: String(c.recommended_message ?? ""),
    installmentRate: Number(c.installment_rate ?? 0),
  }));
  return { ok: true as const, options };
}
