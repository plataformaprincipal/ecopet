"use client";

import { useState } from "react";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SECTIONS = [
  {
    title: "Exclusão de conta",
    paragraphs: [
      "A exclusão definitiva requer análise administrativa para preservar integridade de pedidos, auditoria e obrigações legais.",
      "Se estiver autenticado, use o formulário abaixo para registrar a solicitação formal.",
    ],
  },
];

export default function LegalExclusaoContaPage() {
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/account/request-deletion", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Erro ao enviar");
      setMessage(body.data?.message ?? "Solicitação registrada.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <LegalPageLayout title="Exclusão de Conta" updatedAt="15 de junho de 2026" sections={SECTIONS} />
      <div className="mx-auto max-w-3xl space-y-3 px-6 pb-12">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Motivo ou observações (opcional)"
          aria-label="Motivo da exclusão"
        />
        <Button type="button" onClick={submit} disabled={loading}>
          {loading ? "Enviando…" : "Solicitar exclusão"}
        </Button>
        {message && <p className="text-sm text-ecopet-green">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-muted-foreground">É necessário estar logado. Caso contrário, use privacidade@ecopet.com.br</p>
      </div>
    </div>
  );
}
