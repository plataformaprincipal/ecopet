"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createReport } from "@/lib/social/client-api";

const REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Assédio" },
  { value: "HATE", label: "Ódio" },
  { value: "ANIMAL_ABUSE", label: "Abuso animal" },
  { value: "OTHER", label: "Outro" },
] as const;

export function ReportPostModal({
  postId,
  open,
  onClose,
  onReported,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
  onReported?: () => void;
}) {
  const [reason, setReason] = useState<string>("SPAM");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      await createReport({ postId, reason: reason as "SPAM" });
      onReported?.();
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar publicação</DialogTitle>
        </DialogHeader>
        <select className="w-full rounded border p-2" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <Button onClick={submit} disabled={pending}>
          Enviar denúncia
        </Button>
      </DialogContent>
    </Dialog>
  );
}
