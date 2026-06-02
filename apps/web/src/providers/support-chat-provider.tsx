"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface SupportChatContextValue {
  isOpen: boolean;
  hasUnread: boolean;
  openChat: () => void;
  closeChat: () => void;
  markRead: () => void;
  notifyNew: () => void;
}

const SupportChatContext = createContext<SupportChatContextValue | null>(null);

export function SupportChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setHasUnread(false);
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);
  const markRead = useCallback(() => setHasUnread(false), []);
  const notifyNew = useCallback(() => {
    setHasUnread(true);
  }, []);

  return (
    <SupportChatContext.Provider value={{ isOpen, hasUnread, openChat, closeChat, markRead, notifyNew }}>
      {children}
    </SupportChatContext.Provider>
  );
}

export function useSupportChat() {
  const ctx = useContext(SupportChatContext);
  if (!ctx) throw new Error("useSupportChat must be used within SupportChatProvider");
  return ctx;
}
