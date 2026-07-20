import { defineEvent } from "./definitions";

export const AppointmentEvents = {
  CREATED: defineEvent({
    event_name: "agenda_event_create",
    category: "agenda",
    action: "create",
    module: "appointments",
  }),
  UPDATED: defineEvent({
    event_name: "agenda_event_update",
    category: "agenda",
    action: "update",
    module: "appointments",
  }),
  REMOVED: defineEvent({
    event_name: "agenda_event_remove",
    category: "agenda",
    action: "remove",
    module: "appointments",
  }),
  REMINDER: defineEvent({
    event_name: "agenda_reminder_sent",
    category: "agenda",
    action: "reminder",
    module: "appointments",
  }),
} as const;
