"use client";

import { useEffect, useState } from "react";
import { MessagesHub } from "@/components/features/messages/messages-hub";

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const [id, setId] = useState("");
  useEffect(() => { void params.then((p) => setId(p.conversationId)); }, [params]);
  if (!id) return null;
  return <MessagesHub initialConversationId={id} />;
}
