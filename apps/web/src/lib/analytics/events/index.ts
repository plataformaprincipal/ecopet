export type { AnalyticsEventDefinition, EventModuleCatalog } from "./definitions";
export { defineEvent, catalogValues } from "./definitions";
export {
  EcoPetEventCatalog,
  AnalyticsEvents,
  listAllEventDefinitions,
  countCatalogEvents,
  findEventDefinition,
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
} from "./catalog";
export type { AnalyticsEventName } from "./catalog";

import { dispatchAnalyticsEvent } from "../dispatcher";
import type { TrackEventInput } from "../types";

/** Compat Prompt 1 — delega ao Event Dispatcher. */
export function trackEvent(input: TrackEventInput): boolean {
  return dispatchAnalyticsEvent({
    event: input.name,
    params: input.params,
  }).sent;
}
