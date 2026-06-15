"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messagesApi } from "@/lib/messages/client-api";

export function NewConversationModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}) {
  const [participantId, setParticipantId] = useState("");
  const [type, setType] = useState("DIRECT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { conversation } = await messagesApi.createConversation({
        type,
        participantUserIds: [participantId.trim()],
      });
      onCreated(conversation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conversa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#0f1419]">
        <h2 className="text-lg font-bold">Nova conversa</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="DIRECT">Direct</option>
              <option value="CLIENT_PARTNER">Cliente ↔ Parceiro</option>
              <option value="CLIENT_ONG">Cliente ↔ ONG</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">ID do participante</label>
            <Input value={participantId} onChange={(e) => setParticipantId(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Criando..." : "Criar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
