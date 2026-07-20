import { defineEvent } from "./definitions";

export const MapsEvents = {
  MAP_OPEN: defineEvent({
    event_name: "maps_open",
    category: "maps",
    action: "open",
    module: "maps",
  }),
  AUTOCOMPLETE: defineEvent({
    event_name: "maps_autocomplete",
    category: "maps",
    action: "autocomplete",
    module: "maps",
  }),
  ADDRESS_SELECT: defineEvent({
    event_name: "maps_address_select",
    category: "maps",
    action: "address_select",
    module: "maps",
  }),
  CURRENT_LOCATION: defineEvent({
    event_name: "maps_current_location",
    category: "maps",
    action: "current_location",
    module: "maps",
  }),
  PARTNER_FOUND: defineEvent({
    event_name: "maps_partner_found",
    category: "maps",
    action: "partner_found",
    module: "maps",
  }),
  NGO_FOUND: defineEvent({
    event_name: "maps_ngo_found",
    category: "maps",
    action: "ngo_found",
    module: "maps",
  }),
  ROUTE_CREATE: defineEvent({
    event_name: "maps_route_create",
    category: "maps",
    action: "route",
    module: "maps",
  }),
} as const;
