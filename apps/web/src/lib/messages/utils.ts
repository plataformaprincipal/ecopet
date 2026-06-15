import type { ConversationType, UserRole } from "@prisma/client";

export class ChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400
  ) {
    super(message);
    this.name = "ChatError";
  }
}

export function directConversationKey(userA: string, userB: string) {
  const [a, b] = [userA, userB].sort();
  return `direct:${a}:${b}`;
}

export function mapLegacyConversationType(type: ConversationType): ConversationType {
  if (type === "CLIENT_NGO") return "CLIENT_ONG";
  if (type === "CLIENT_CLIENT") return "DIRECT";
  return type;
}

export function resolveConversationTypeForRoles(
  initiatorRole: UserRole,
  targetRole: UserRole,
  requested?: ConversationType
): ConversationType {
  if (requested === "SUPPORT" || requested === "SYSTEM" || requested === "DIRECT") {
    return requested;
  }
  if (requested === "CLIENT_ONG" || requested === "CLIENT_PARTNER") {
    return requested;
  }
  if (initiatorRole === "CLIENT" && targetRole === "PARTNER") return "CLIENT_PARTNER";
  if (initiatorRole === "CLIENT" && targetRole === "ONG") return "CLIENT_ONG";
  if (initiatorRole === "PARTNER" && targetRole === "CLIENT") return "CLIENT_PARTNER";
  if (initiatorRole === "ONG" && targetRole === "CLIENT") return "CLIENT_ONG";
  return "DIRECT";
}

export function isRolePairAllowed(type: ConversationType, roles: UserRole[]) {
  const set = new Set(roles);
  switch (type) {
    case "CLIENT_PARTNER":
      return set.has("CLIENT") && set.has("PARTNER");
    case "CLIENT_ONG":
      return set.has("CLIENT") && set.has("ONG");
    case "DIRECT":
      return roles.length === 2;
    case "SUPPORT":
      return true;
    default:
      return true;
  }
}
