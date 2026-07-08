"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NgoErpModulePanel } from "./ngo-erp-module-panel";
import { NGO_ERP_MODULE_CONFIG } from "@/lib/ong/erp/module-config";
import { ALL_NGO_AI_ASSISTANTS } from "@/lib/ong/erp/ngo-platform-service";

export function NgoIaErpPage() {
  const searchParams = useSearchParams();
  const initialAssistant = searchParams.get("assistant") ?? "adoption";
  const [assistantId, setAssistantId] = useState(initialAssistant);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/ong/erp/ia", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (json.success) setConfigured((json.data as { aiConfigured?: boolean }).aiConfigured ?? false);
      else setConfigured(false);
    })();
  }, []);

  const send = useCallback(async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setReply(null);
    try {
      const res = await fetch("/api/ong/erp/ia/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, assistantId }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "IA ainda não configurada.");
        return;
      }
      setReply(json.data.content ?? "Sem resposta.");
    } finally {
      setLoading(false);
    }
  }, [message, assistantId]);

  return (
    <div className="space-y-4">
      <NgoErpModulePanel config={NGO_ERP_MODULE_CONFIG.ia} />
      <section className="mx-4 mb-6 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60 sm:mx-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-rose-600" aria-hidden />
          <h2 className="font-semibold">Assistentes IA ONG</h2>
        </div>
        {configured === false ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">IA ainda não configurada.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {ALL_NGO_AI_ASSISTANTS.map((a) => (
                <Button
                  key={a.id}
                  size="sm"
                  variant={assistantId === a.id ? "default" : "outline"}
                  onClick={() => setAssistantId(a.id)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
            <textarea
              className="mb-2 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900"
              rows={3}
              placeholder="Pergunte ao assistente…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={() => void send()} disabled={loading || !message.trim()}>
              Enviar via Orchestrator
            </Button>
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
            {reply ? <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-white/5">{reply}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}
