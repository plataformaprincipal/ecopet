"use client";

import { useState } from "react";
import { Send, Sparkles, AlertTriangle } from "lucide-react";
import { EcopetSymbol } from "@/components/shared/brand/ecopet-symbol";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layouts/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { AI_DISCLAIMER } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";

const modes = [
  { id: "general", label: "Geral" },
  { id: "triage", label: "Triagem" },
  { id: "behavior", label: "Comportamento" },
  { id: "nutrition", label: "Alimentação" },
] as const;

export default function IAPage() {
  const token = useAppStore((s) => s.apiToken);
  const [mode, setMode] = useState<string>("general");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await api<{ reply: string }>("/api/ai/chat", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({ message: userMsg, type: mode }),
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Configure a API e faça login para usar a IA completa.\n\n${AI_DISCLAIMER}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppHeader title="IA ECOPET" />
      <main className="mx-auto flex max-w-3xl flex-1 flex-col p-4 lg:p-6">
        <Card className="mb-4 border-ecopet-yellow/30 bg-ecopet-yellow/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-ecopet-yellow" />
            <p className="text-sm font-medium text-ecopet-dark dark:text-white">{AI_DISCLAIMER}</p>
          </CardContent>
        </Card>

        <div className="mb-4 flex flex-wrap gap-2">
          {modes.map((m) => (
            <Button key={m.id} variant={mode === m.id ? "default" : "outline"} size="sm" onClick={() => setMode(m.id)}>
              {m.label}
            </Button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border bg-white p-4 dark:bg-white/5 min-h-[400px]">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-ecopet-gray">
              <EcopetSymbol variant="accent" size={64} animated="pulse" className="mb-4" />
              <p className="font-display font-semibold">ECOPET IA</p>
              <p className="mt-2 caption-text">Pergunte sobre cuidados, comportamento ou alimentação do seu pet.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-ecopet-green text-white"
                    : "bg-gray-100 dark:bg-white/10"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && <p className="text-sm text-ecopet-gray animate-pulse">IA pensando...</p>}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-xl border px-4 py-3 text-sm focus:border-ecopet-green focus:outline-none dark:bg-white/5"
            placeholder="Descreva sintomas, dúvidas ou comportamento..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button onClick={send} disabled={loading} size="icon">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </main>
    </>
  );
}
