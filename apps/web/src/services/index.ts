/**
 * Camada de serviços — clientes HTTP e integrações externas.
 * Importe do domínio específico para evitar colisões de nomes.
 */
export { api } from "@/lib/api";
export { ApiRequestError } from "@/lib/api-errors";

export * as authService from "@/lib/auth/api";
export * as marketplaceService from "@/lib/marketplace/api";
export * as socialService from "@/lib/social/api";
export * as petsService from "@/lib/pets/api";
export * as ordersService from "@/lib/orders/api";
export * as notificationsService from "@/lib/notifications/api";
export * as agroService from "@/lib/agro/api";
export * as gestorService from "@/lib/gestor/api";
export * as platformService from "@/lib/platform/api";
export * as advisoryService from "@/lib/advisory/api";
export * as walletService from "@/lib/wallet/api";
export * as robotsService from "@/lib/robots/api";
export * as iotService from "@/lib/iot/api";
export * as logisticsService from "@/lib/logistics/api";
export * as appointmentsService from "@/lib/appointments/api";
