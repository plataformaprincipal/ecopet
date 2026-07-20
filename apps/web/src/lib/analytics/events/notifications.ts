import { defineEvent } from "./definitions";

export const NotificationEvents = {
  VIEWED: defineEvent({
    event_name: "notif_viewed",
    category: "notifications",
    action: "viewed",
    module: "notifications",
  }),
  OPENED: defineEvent({
    event_name: "notif_opened",
    category: "notifications",
    action: "opened",
    module: "notifications",
  }),
  DISMISSED: defineEvent({
    event_name: "notif_dismissed",
    category: "notifications",
    action: "dismissed",
    module: "notifications",
  }),
  CLICK: defineEvent({
    event_name: "notif_click",
    category: "notifications",
    action: "click",
    module: "notifications",
  }),
} as const;
