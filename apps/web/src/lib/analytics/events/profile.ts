import { defineEvent } from "./definitions";

export const ProfileEvents = {
  CLIENT_CREATE: defineEvent({
    event_name: "profile_client_create",
    category: "profile",
    action: "create",
    module: "profile",
  }),
  EDIT: defineEvent({
    event_name: "profile_edit",
    category: "profile",
    action: "edit",
    module: "profile",
  }),
  SAVE: defineEvent({
    event_name: "profile_save",
    category: "profile",
    action: "save",
    module: "profile",
  }),
  PHOTO_ADD: defineEvent({
    event_name: "profile_photo_add",
    category: "profile",
    action: "photo_add",
    module: "profile",
  }),
  PHOTO_DELETE: defineEvent({
    event_name: "profile_photo_delete",
    category: "profile",
    action: "photo_delete",
    module: "profile",
  }),
  ADDRESS_CHANGE: defineEvent({
    event_name: "profile_address_change",
    category: "profile",
    action: "address_change",
    module: "profile",
  }),
  PHONE_CHANGE: defineEvent({
    event_name: "profile_phone_change",
    category: "profile",
    action: "phone_change",
    module: "profile",
  }),
  PREFS_CHANGE: defineEvent({
    event_name: "profile_prefs_change",
    category: "profile",
    action: "prefs_change",
    module: "profile",
  }),
  LANGUAGE_CHANGE: defineEvent({
    event_name: "profile_language_change",
    category: "profile",
    action: "language_change",
    module: "profile",
  }),
} as const;
