export function validateOnlinePaymentMethod(input: {
  paymentMethodId: string;
  paymentMethodType?: string;
  cardToken?: string;
  installments?: number;
}): "INSTALLMENTS_NOT_ALLOWED" | "PAYMENT_METHOD_NOT_ALLOWED" | null {
  const methodId = input.paymentMethodId.toLowerCase();
  const isCard = Boolean(input.cardToken);
  if (input.installments != null && input.installments !== 1)
    return "INSTALLMENTS_NOT_ALLOWED";
  if (input.paymentMethodType && input.paymentMethodType !== "credit_card") {
    return "PAYMENT_METHOD_NOT_ALLOWED";
  }
  if (methodId === "boleto" || (isCard && methodId === "pix")) {
    return "PAYMENT_METHOD_NOT_ALLOWED";
  }
  if (!isCard && methodId !== "pix") return "PAYMENT_METHOD_NOT_ALLOWED";
  return null;
}
