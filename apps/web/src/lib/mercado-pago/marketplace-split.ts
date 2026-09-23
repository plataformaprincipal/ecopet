import "server-only";

import {
  createMercadoPagoMarketplacePayment,
  getMercadoPagoLegacyPayment,
} from "@/lib/mercado-pago/client";
import { mapMpLegacyPaymentStatusToInternal } from "@/lib/mercado-pago/status";
import { evaluateMarketplaceSplit } from "@/lib/finance/split-capability";
import {
  getPartnerMpConnectionView,
  getUsablePartnerMpAccessToken,
  refreshPartnerMpAccessToken,
} from "@/lib/mercado-pago/partner-oauth";

export async function resolveOrderMarketplaceSplit(params: {
  partnerId: string | null;
  itemPartnerIds: Array<string | null>;
  amount: number;
  applicationFeeAmount: number;
}) {
  const distinct = [...new Set(params.itemPartnerIds.filter(Boolean))] as string[];
  const multiPartnerCart = distinct.length > 1;
  const partnerId = params.partnerId ?? distinct[0] ?? null;
  let connection = partnerId ? await getPartnerMpConnectionView(partnerId) : null;
  if (partnerId && connection?.status === "REAUTH_REQUIRED") {
    await refreshPartnerMpAccessToken(partnerId);
    connection = await getPartnerMpConnectionView(partnerId);
  }
  const capability = evaluateMarketplaceSplit({
    partnerConnection: connection,
    multiPartnerCart,
    applicationFeeAmount: params.applicationFeeAmount,
    transactionAmount: params.amount,
  });
  return { partnerId, connection, capability };
}

export function sanitizeMarketplacePaymentForClient(mp: Record<string, unknown>) {
  const poi = mp.point_of_interaction as
    | { transaction_data?: { ticket_url?: string; qr_code?: string; qr_code_base64?: string } }
    | undefined;
  const tx = poi?.transaction_data;
  return {
    id: mp.id != null ? String(mp.id) : null,
    status: typeof mp.status === "string" ? mp.status : null,
    statusDetail: typeof mp.status_detail === "string" ? mp.status_detail : null,
    paymentId: mp.id != null ? String(mp.id) : null,
    paymentStatus: typeof mp.status === "string" ? mp.status : null,
    ticketUrl: tx?.ticket_url ?? null,
    qrCode: tx?.qr_code ?? null,
    qrCodeBase64: tx?.qr_code_base64 ?? null,
    methodId: typeof mp.payment_method_id === "string" ? mp.payment_method_id : null,
    methodType: typeof mp.payment_type_id === "string" ? mp.payment_type_id : null,
  };
}

export async function createSplitMarketplacePayment(params: {
  partnerId: string;
  amount: number;
  applicationFee: number;
  idempotencyKey: string;
  externalReference: string;
  description: string;
  paymentMethodId: string;
  cardToken?: string;
  installments?: 1;
  payerEmail: string;
  payerFirstName?: string;
  payerLastName?: string;
  identificationType?: string;
  identificationNumber?: string;
}) {
  const token = await getUsablePartnerMpAccessToken(params.partnerId);
  if (!token.ok) {
    return { ok: false as const, code: "SELLER_TOKEN_UNAVAILABLE", message: token.reason };
  }
  const methodId = params.paymentMethodId.toLowerCase();
  const body = {
    transaction_amount: Number(params.amount.toFixed(2)),
    description: params.description,
    payment_method_id: methodId,
    installments: 1,
    payer: {
      email: params.payerEmail,
      ...(params.payerFirstName ? { first_name: params.payerFirstName } : {}),
      ...(params.payerLastName ? { last_name: params.payerLastName } : {}),
      ...(params.identificationType && params.identificationNumber
        ? { identification: { type: params.identificationType, number: params.identificationNumber } }
        : {}),
    },
    application_fee: Number(params.applicationFee.toFixed(2)),
    external_reference: params.externalReference,
    binary_mode: false,
    ...(params.cardToken ? { token: params.cardToken } : {}),
    ...(methodId === "boleto" ? { date_of_expiration: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString() } : {}),
  };
  const result = await createMercadoPagoMarketplacePayment(body, params.idempotencyKey, token.accessToken);
  if (!result.ok) return result;
  return {
    ok: true as const,
    data: result.data,
    collectorId: token.mpUserId,
    applicationFee: body.application_fee,
    mappedStatus: mapMpLegacyPaymentStatusToInternal(
      typeof result.data.status === "string" ? result.data.status : undefined,
      typeof result.data.status_detail === "string" ? result.data.status_detail : undefined
    ),
  };
}

export async function pollMarketplacePayment(providerPaymentId: string) {
  return getMercadoPagoLegacyPayment(providerPaymentId);
}
