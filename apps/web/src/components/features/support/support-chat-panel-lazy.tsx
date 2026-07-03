"use client";

import dynamic from "next/dynamic";
import { useSupportChat } from "@/providers/support-chat-provider";

const SupportChatPanel = dynamic(
  () =>
    import("@/components/features/support/support-chat-panel").then((m) => ({
      default: m.SupportChatPanel,
    })),
  { ssr: false }
);

/** Monta o painel de chat somente quando aberto — evita fetch de perfil em toda página. */
export function SupportChatPanelLazy() {
  const { isOpen } = useSupportChat();
  if (!isOpen) return null;
  return <SupportChatPanel />;
}
