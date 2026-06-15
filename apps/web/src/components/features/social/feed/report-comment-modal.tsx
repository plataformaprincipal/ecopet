"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createReport } from "@/lib/social/client-api";

export function ReportCommentModal({
  commentId,
  open,
  onClose,
}: {
  commentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      await createReport({ commentId, reason: "OTHER" });
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar comentário</DialogTitle>
        </DialogHeader>
        <Button onClick={submit} disabled={pending}>
          Confirmar denúncia
        </Button>
      </DialogContent>
    </Dialog>
  );
}
