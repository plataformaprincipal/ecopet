export type ParsedMpWebhook = {
  rawType: string;
  action: string | null;
  providerEventId: string | null;
  resourceId: string | null;
  applicationId: string | null;
  mpUserId: string | null;
  liveMode: boolean | null;
  data: Record<string, unknown>;
  body: Record<string, unknown>;
};

export function parseMercadoPagoWebhookBody(rawBody: string): ParsedMpWebhook | null {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return null;
  }

  const data =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : {};

  const resourceId =
    data.id != null
      ? String(data.id)
      : body.id != null && typeof body.id !== "object"
        ? String(body.id)
        : data.payment_id != null
          ? String(data.payment_id)
          : null;

  const providerEventId = body.id != null ? String(body.id) : null;

  return {
    rawType: String(body.type ?? body.topic ?? "unknown"),
    action: body.action != null ? String(body.action) : Array.isArray(body.actions) ? String(body.actions[0]) : null,
    providerEventId,
    resourceId,
    applicationId: body.application_id != null ? String(body.application_id) : null,
    mpUserId: body.user_id != null ? String(body.user_id) : null,
    liveMode: typeof body.live_mode === "boolean" ? body.live_mode : null,
    data,
    body,
  };
}

/** Payload sanitizado — sem headers, tokens, cartão. */
export function sanitizeWebhookPayload(parsed: ParsedMpWebhook): Record<string, unknown> {
  const data = { ...parsed.data };
  delete data.token;
  delete data.card_number;
  delete data.security_code;
  delete data.cvv;
  delete data.password;

  return {
    type: parsed.rawType,
    action: parsed.action,
    id: parsed.providerEventId,
    live_mode: parsed.liveMode,
    user_id: parsed.mpUserId,
    application_id: parsed.applicationId,
    data: {
      id: data.id != null ? String(data.id) : null,
      payment_id: data.payment_id != null ? String(data.payment_id) : null,
      merchant_order: data.merchant_order != null ? String(data.merchant_order) : null,
      resource: data.resource ?? null,
      customer_id: data.customer_id != null ? String(data.customer_id) : null,
      new_card_id: data.new_card_id != null ? String(data.new_card_id) : null,
      old_card_id: data.old_card_id != null ? String(data.old_card_id) : null,
      description: typeof data.description === "string" ? data.description.slice(0, 280) : null,
      site_id: data.site_id != null ? String(data.site_id) : null,
      checkout: data.checkout ?? null,
    },
  };
}
