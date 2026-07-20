import { defineEvent } from "./definitions";

export const MarketplaceEvents = {
  VIEW_ITEM: defineEvent({
    event_name: "view_item",
    category: "marketplace",
    action: "view",
    module: "marketplace",
  }),
  SEARCH: defineEvent({
    event_name: "search",
    category: "marketplace",
    action: "search",
    module: "marketplace",
  }),
  FILTER: defineEvent({
    event_name: "mp_filter_applied",
    category: "marketplace",
    action: "filter",
    module: "marketplace",
  }),
  CATEGORY: defineEvent({
    event_name: "mp_category_select",
    category: "marketplace",
    action: "category",
    module: "marketplace",
  }),
  FAVORITE: defineEvent({
    event_name: "mp_product_favorite",
    category: "marketplace",
    action: "favorite",
    module: "marketplace",
  }),
  SHARE: defineEvent({
    event_name: "share",
    category: "marketplace",
    action: "share",
    module: "marketplace",
  }),
  ADD_TO_CART: defineEvent({
    event_name: "add_to_cart",
    category: "marketplace",
    action: "add",
    module: "marketplace",
  }),
  REMOVE_FROM_CART: defineEvent({
    event_name: "remove_from_cart",
    category: "marketplace",
    action: "remove",
    module: "marketplace",
  }),
  UPDATE_CART_QTY: defineEvent({
    event_name: "mp_cart_qty_update",
    category: "marketplace",
    action: "update_qty",
    module: "marketplace",
  }),
  BUY_NOW: defineEvent({
    event_name: "mp_buy_now",
    category: "marketplace",
    action: "buy_now",
    module: "marketplace",
  }),
  CART_VIEW: defineEvent({
    event_name: "mp_cart_view",
    category: "marketplace",
    action: "view_cart",
    module: "marketplace",
  }),
} as const;
