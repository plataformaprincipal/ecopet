"use client";

import { useEffect, useState } from "react";
import { MessagesPageContent } from "@/components/messages/MessagesPageContent";

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const [id, setId] = useState("");
  useEffect(() => { void params.then((p) => setId(p.conversationId)); }, [params]);
  if (!id) return null;
  return <MessagesPageContent initialConversationId={id} />;
}
