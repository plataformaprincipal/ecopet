"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONVERSATIONS_POLL_MS, MESSAGES_POLL_MS } from "@/lib/messages/constants";
import { messagesApi, type ChatMessage, type ConversationItem } from "@/lib/messages/client-api";

function useVisibilityPause() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return visible;
}

export function useConversationsPolling(enabled = true) {
  const visible = useVisibilityPause();
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const data = await messagesApi.listConversations();
      setItems(data.items);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar conversas");
    } finally {
      setLoading(false);
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    if (!visible) return;
    const id = setInterval(() => void refresh(), CONVERSATIONS_POLL_MS);
    return () => clearInterval(id);
  }, [enabled, visible, refresh]);

  return { items, loading, error, refresh };
}

export function useMessagesPolling(conversationId: string | null) {
  const visible = useVisibilityPause();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (!conversationId || inflight.current) return;
    inflight.current = true;
    setLoading(true);
    try {
      const data = await messagesApi.listMessages(conversationId);
      setMessages(data.items);
      setError("");
      await messagesApi.markRead(conversationId).catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar mensagens");
    } finally {
      setLoading(false);
      inflight.current = false;
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    void refresh();
    if (!visible) return;
    const id = setInterval(() => void refresh(), MESSAGES_POLL_MS);
    return () => clearInterval(id);
  }, [conversationId, visible, refresh]);

  return { messages, loading, error, refresh, setMessages };
}
