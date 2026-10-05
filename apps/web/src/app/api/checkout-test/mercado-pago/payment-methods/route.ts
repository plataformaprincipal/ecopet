import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { getMercadoPagoTestCheckoutBlock } from "@/lib/mercado-pago/test-credentials";
import { getTestMercadoPagoPaymentMethods } from "@/lib/mercado-pago/test-client";

export const dynamic = "force-dynamic";

type EcoPetPaymentMethodId = "credit_card" | "debit_card" | "pix" | "boleto";

function detectSupported(methods: Array<Record<string, unknown>>): EcoPetPaymentMethodId[] {
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
    if (type === "ticket" || id === "bolbradesco" || id === "boleto") result.boleto = true;
  }
  return (Object.keys(result) as EcoPetPaymentMethodId[]).filter((k) => result[k]);
}

const LABELS: Record<EcoPetPaymentMethodId, string> = {
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  pix: "Pix",
  boleto: "Boleto bancário",
};

/** GET — meios da conta TEST. Não sincroniza PaymentMethodConfiguration LIVE. */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const block = getMercadoPagoTestCheckoutBlock();
  if (block) return apiFailure(block.code, block.message, 503);

  const remote = await getTestMercadoPagoPaymentMethods();
  const ids = remote.ok ? detectSupported(remote.data || []) : (["credit_card"] as EcoPetPaymentMethodId[]);
  const methods = (ids.length ? ids : (["credit_card"] as EcoPetPaymentMethodId[])).map((methodId) => ({
    methodId,
    displayName: LABELS[methodId],
  }));
  return apiSuccess({ methods });
}
