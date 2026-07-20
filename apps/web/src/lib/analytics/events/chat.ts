import { defineEvent } from "./definitions";

export const ChatEvents = {
  MESSAGE_SENT: defineEvent({
    event_name: "chat_message_sent",
    category: "chat",
    action: "send",
    module: "chat",
  }),
  MESSAGE_RECEIVED: defineEvent({
    event_name: "chat_message_received",
    category: "chat",
    action: "receive",
    module: "chat",
  }),
  FILE_SENT: defineEvent({
    event_name: "chat_file_sent",
    category: "chat",
    action: "file",
    module: "chat",
  }),
  IMAGE_SENT: defineEvent({
    event_name: "chat_image_sent",
    category: "chat",
    action: "image",
    module: "chat",
  }),
  AUDIO_SENT: defineEvent({
    event_name: "chat_audio_sent",
    category: "chat",
    action: "audio",
    module: "chat",
  }),
  MESSAGE_DELETED: defineEvent({
    event_name: "chat_message_deleted",
    category: "chat",
    action: "delete",
    module: "chat",
  }),
} as const;
