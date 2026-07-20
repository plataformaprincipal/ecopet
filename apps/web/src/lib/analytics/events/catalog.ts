import { AuthEvents } from "./auth";
import { MarketplaceEvents } from "./marketplace";
import { ProductEvents } from "./products";
import { ServiceEvents } from "./services";
import { AppointmentEvents } from "./appointments";
import { OrderEvents } from "./orders";
import { PaymentEvents } from "./payments";
import { PetEvents } from "./pets";
import { SocialEvents } from "./social";
import { NotificationEvents } from "./notifications";
import { PartnerEvents } from "./partners";
import { NgoEvents } from "./ngo";
import { AdminEvents } from "./admin";
import { ChatEvents } from "./chat";
import { AiEvents } from "./ai";
import { ProfileEvents } from "./profile";
import { SearchEvents } from "./search";
import { MapsEvents } from "./maps";
import { ErrorEvents } from "./errors";
import { PerformanceEvents } from "./performance";
import { SharedEvents } from "./shared";
import type { AnalyticsEventDefinition } from "./definitions";
import { catalogValues } from "./definitions";

/** Catálogo unificado EcoPet (todos os módulos). */
export const EcoPetEventCatalog = {
  auth: AuthEvents,
  marketplace: MarketplaceEvents,
  products: ProductEvents,
  services: ServiceEvents,
  appointments: AppointmentEvents,
  orders: OrderEvents,
  payments: PaymentEvents,
  pets: PetEvents,
  social: SocialEvents,
  notifications: NotificationEvents,
  partners: PartnerEvents,
  ngo: NgoEvents,
  admin: AdminEvents,
  chat: ChatEvents,
  ai: AiEvents,
  profile: ProfileEvents,
  search: SearchEvents,
  maps: MapsEvents,
  errors: ErrorEvents,
  performance: PerformanceEvents,
  shared: SharedEvents,
} as const;

/** Alias GA4 recomendados + EcoPet (compat Prompt 1). */
export const AnalyticsEvents = {
  SIGN_UP: AuthEvents.SIGN_UP.event_name,
  LOGIN: AuthEvents.LOGIN.event_name,
  SEARCH: SearchEvents.SEARCH.event_name,
  VIEW_ITEM: MarketplaceEvents.VIEW_ITEM.event_name,
  ADD_TO_CART: MarketplaceEvents.ADD_TO_CART.event_name,
  BEGIN_CHECKOUT: OrderEvents.BEGIN_CHECKOUT.event_name,
  PURCHASE: OrderEvents.PURCHASE.event_name,
  SHARE: SharedEvents.SHARE.event_name,
  GENERATE_LEAD: ProductEvents.LEAD.event_name,
  SELECT_CONTENT: SharedEvents.SELECT_CONTENT.event_name,
  CONSENT_UPDATE: SharedEvents.CONSENT_UPDATE.event_name,
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export function listAllEventDefinitions(): AnalyticsEventDefinition[] {
  return Object.values(EcoPetEventCatalog).flatMap((mod) =>
    catalogValues(mod as Record<string, AnalyticsEventDefinition>)
  );
}

export function countCatalogEvents(): number {
  return listAllEventDefinitions().length;
}

export function findEventDefinition(eventName: string): AnalyticsEventDefinition | undefined {
  return listAllEventDefinitions().find((e) => e.event_name === eventName);
}

export {
  AuthEvents,
  MarketplaceEvents,
  ProductEvents,
  ServiceEvents,
  AppointmentEvents,
  OrderEvents,
  PaymentEvents,
  PetEvents,
  SocialEvents,
  NotificationEvents,
  PartnerEvents,
  NgoEvents,
  AdminEvents,
  ChatEvents,
  AiEvents,
  ProfileEvents,
  SearchEvents,
  MapsEvents,
  ErrorEvents,
  PerformanceEvents,
  SharedEvents,
};
