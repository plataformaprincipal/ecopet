/**
 * Tópicos oficiais do painel Webhooks Mercado Pago.
 * Fonte: docs Your Integrations → Notifications → Webhooks / Additional info.
 * Não inventar topics.
 */

export type MpPanelTopicKey =
  | "order"
  | "payment"
  | "fraud_alert"
  | "card_updater"
  | "shipment"
  | "application_link"
  | "claim"
  | "dispute"
  | "payer_profile"
  | "subscription"
  | "delivery"
  | "commercial_order"
  | "point"
  | "wallet_connect"
  | "self_service"
  | "unknown";

export type MpTopicCapability =
  | "ACTIVE" // processado com consulta API / efeito de negócio
  | "PARTIAL" // persistido + admin; efeito limitado
  | "UNSUPPORTED" // topic conhecido mas handler não consulta API (docs insuficientes / não contratado)
  | "NOT_APPLICABLE"; // produto não usado no EcoPet

export type MpTopicDefinition = {
  panelKey: MpPanelTopicKey;
  /** Valores em `type` / topic do JSON oficial */
  typeAliases: string[];
  panelLabel: string;
  capability: MpTopicCapability;
  /** Endpoint GET oficial quando aplicável (path relativo a api.mercadopago.com) */
  resourceGetPath?: string;
  notes: string;
};

export const MP_TOPIC_CATALOG: MpTopicDefinition[] = [
  {
    panelKey: "order",
    typeAliases: ["order", "orders"],
    panelLabel: "Order (Mercado Pago)",
    capability: "ACTIVE",
    resourceGetPath: "/v1/orders/{id}",
    notes: "Checkout Transparente via API Orders — fluxo canônico EcoPet.",
  },
  {
    panelKey: "payment",
    typeAliases: ["payment", "payments"],
    panelLabel: "Pagamentos (legacy)",
    capability: "PARTIAL",
    resourceGetPath: "/v1/payments/{id}",
    notes: "Compatibilidade; não substitui API Orders. Evita duplicar estoque/comissões.",
  },
  {
    panelKey: "fraud_alert",
    typeAliases: ["stop_delivery_op_wh"],
    panelLabel: "Alertas de fraude",
    capability: "ACTIVE",
    notes: "Sem retry no MP se não responder 200/201. Bloqueia expedição; revisão admin.",
  },
  {
    panelKey: "card_updater",
    typeAliases: ["topic_card_id_wh", "automatic-payments"],
    panelLabel: "Card Updater",
    capability: "NOT_APPLICABLE",
    notes: "EcoPet não persiste cartão/recorrência MP. Apenas registro sanitizado.",
  },
  {
    panelKey: "shipment",
    typeAliases: ["shipments", "shipment", "topic_shipping"],
    panelLabel: "Envios (Mercado Pago)",
    capability: "NOT_APPLICABLE",
    notes: "EcoPet usa logística própria do parceiro; sem produto Mercado Envios contratado.",
  },
  {
    panelKey: "application_link",
    typeAliases: ["mp-connect", "application"],
    panelLabel: "Vinculação de aplicações",
    capability: "PARTIAL",
    notes: "OAuth de vendedores não ativado. Registra vínculo/revogação sem tokens.",
  },
  {
    panelKey: "claim",
    typeAliases: ["topic_claims_integration_wh", "claim", "claims"],
    panelLabel: "Reclamações",
    capability: "ACTIVE",
    resourceGetPath: "/v1/claims/{id}",
    notes: "Consulta claim quando data.id disponível.",
  },
  {
    panelKey: "dispute",
    typeAliases: ["topic_chargebacks_wh", "chargebacks", "chargeback"],
    panelLabel: "Contestações",
    capability: "ACTIVE",
    resourceGetPath: "/v1/chargebacks/{id}",
    notes: "Chargeback — bloqueia repasse estimado; fila admin.",
  },
  {
    panelKey: "payer_profile",
    typeAliases: ["payer", "payer_profile", "topic_payer"],
    panelLabel: "Perfil de pagamento",
    capability: "NOT_APPLICABLE",
    notes: "Sem documentação aplicável ao fluxo Orders atual do EcoPet.",
  },
  {
    panelKey: "subscription",
    typeAliases: [
      "subscription_authorized_payment",
      "subscription_preapproval",
      "subscription_preapproval_plan",
    ],
    panelLabel: "Planos e assinaturas",
    capability: "NOT_APPLICABLE",
    notes: "Assinaturas MP não ativadas. Registro estrutural apenas.",
  },
  {
    panelKey: "delivery",
    typeAliases: ["delivery", "proximity", "topic_delivery"],
    panelLabel: "Delivery / proximity marketplace",
    capability: "NOT_APPLICABLE",
    notes: "Produto não integrado ao EcoPet.",
  },
  {
    panelKey: "commercial_order",
    typeAliases: ["topic_merchant_order_wh", "merchant_order", "merchant_orders"],
    panelLabel: "Pedidos comerciais",
    capability: "PARTIAL",
    resourceGetPath: "/merchant_orders/{id}",
    notes: "Checkout Pro / merchant order — compatibilidade; Orders é canônico.",
  },
  {
    panelKey: "point",
    typeAliases: ["point_integration_wh", "point_integration_wh"],
    panelLabel: "Integrações Point",
    capability: "NOT_APPLICABLE",
    notes: "Sem terminais Point no EcoPet.",
  },
  {
    panelKey: "wallet_connect",
    typeAliases: ["wallet_connect"],
    panelLabel: "Wallet Connect",
    capability: "NOT_APPLICABLE",
    notes: "Produto não contratado/ativado.",
  },
  {
    panelKey: "self_service",
    typeAliases: ["self_service", "selfservice", "topic_self_service"],
    panelLabel: "Self Service",
    capability: "NOT_APPLICABLE",
    notes: "Sem documentação de uso no EcoPet.",
  },
];

export function resolvePanelTopic(rawType: string | undefined | null): MpTopicDefinition {
  const t = (rawType || "").toLowerCase().trim();
  for (const def of MP_TOPIC_CATALOG) {
    if (def.typeAliases.some((a) => a.toLowerCase() === t)) return def;
  }
  return {
    panelKey: "unknown",
    typeAliases: [t || "unknown"],
    panelLabel: "Desconhecido",
    capability: "UNSUPPORTED",
    notes: "Tipo não mapeado — persistido sem efeito financeiro.",
  };
}
