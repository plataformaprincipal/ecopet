"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messagesApi } from "@/lib/messages/client-api";

export function MessageReportModal({
  messageId,
  open,
  onClose,
}: {
  messageId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!open || !messageId) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await messagesApi.reportMessage(messageId!, reason, description);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#0f1419]">
        <h2 className="font-bold">Denunciar mensagem</h2>
        {done ? (
          <p className="mt-4 text-sm text-green-700">Denúncia enviada. Nossa equipe irá revisar.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Input placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} required />
            <Input placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={loading}>Enviar</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
