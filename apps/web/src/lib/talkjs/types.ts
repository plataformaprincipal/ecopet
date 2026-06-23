import type { ConversationContextType, UserRole } from "@prisma/client";

export type TalkJsUserPayload = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  role: UserRole;
};

export type CreateTalkJsConversationInput = {
  creatorId: string;
  participantUserId: string;
  contextType?: ConversationContextType;
  contextId?: string | null;
  title?: string;
};

export type TalkJsSessionPayload = {
  appId: string;
  userId: string;
  signature: string | null;
  user: TalkJsUserPayload;
  identityVerificationEnabled: boolean;
};
