import { defineEvent } from "./definitions";

export const SocialEvents = {
  FEED_OPEN: defineEvent({
    event_name: "social_feed_open",
    category: "social",
    action: "feed_open",
    module: "social",
  }),
  POST_CREATE: defineEvent({
    event_name: "social_post_create",
    category: "social",
    action: "create",
    module: "social",
  }),
  POST_EDIT: defineEvent({
    event_name: "social_post_edit",
    category: "social",
    action: "edit",
    module: "social",
  }),
  POST_DELETE: defineEvent({
    event_name: "social_post_delete",
    category: "social",
    action: "delete",
    module: "social",
  }),
  LIKE: defineEvent({
    event_name: "social_like",
    category: "social",
    action: "like",
    module: "social",
  }),
  COMMENT: defineEvent({
    event_name: "social_comment",
    category: "social",
    action: "comment",
    module: "social",
  }),
  REPLY: defineEvent({
    event_name: "social_reply",
    category: "social",
    action: "reply",
    module: "social",
  }),
  SHARE: defineEvent({
    event_name: "social_share",
    category: "social",
    action: "share",
    module: "social",
  }),
  SAVE: defineEvent({
    event_name: "social_save",
    category: "social",
    action: "save",
    module: "social",
  }),
  REPORT: defineEvent({
    event_name: "social_report",
    category: "social",
    action: "report",
    module: "social",
  }),
  SEARCH: defineEvent({
    event_name: "social_search",
    category: "social",
    action: "search",
    module: "social",
  }),
  PROFILE_OPEN: defineEvent({
    event_name: "social_profile_open",
    category: "social",
    action: "profile_open",
    module: "social",
  }),
} as const;