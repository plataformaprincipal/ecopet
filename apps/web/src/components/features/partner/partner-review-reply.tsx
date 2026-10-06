"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PartnerReviewReply({ reviewId, existing }: { reviewId: string; existing?: string | null }) {
  const [reply, setReply] = useState("");
  const [saved, setSaved] = useState(existing ?? "");
  const [error, setError] = useState("");
  if (saved) return <p className="mt-2 text-xs text-ecopet-green">Sua resposta: {saved}</p>;
  return (
    <div className="mt-2 space-y-2">
      <textarea className="w-full rounded-md border px-2 py-1 text-xs" rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Responder avaliação" />
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          const res = await fetch(`/api/reviews/${reviewId}/reply`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply }),
          });
          const data = await res.json();
          if (data.success) setSaved(reply);
          else setError(data.error?.message ?? "Não foi possível responder.");
        }}
      >
        Responder
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
