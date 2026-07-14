"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Sparkles, PawPrint, ShoppingBag, Stethoscope,
  Compass, Calendar, ChevronRight,
} from "lucide-react";
import { EcopetSymbol } from "@/components/shared/brand/ecopet-symbol";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import {
  AiUnavailableBanner,
  isAiNotConfiguredErrorCode,
} from "@/components/features/ai/ai-unavailable-banner";
import { AI_SAFETY_DISCLAIMER } from "@/lib/ai/ai-disclaimer";

const QUICK_COMMANDS = [
  { labelKey: "empty.ai.quickProducts", icon: ShoppingBag, href: "/marketplace" },
  { labelKey: "empty.ai.quickVet", icon: Stethoscope, href: "/veterinarios" },
  { labelKey: "empty.ai.quickExplore", icon: Compass, href: "/explorar" },
  { labelKey: "empty.ai.quickPet", icon: PawPrint, href: "/meu-pet" },
  { labelKey: "empty.ai.quickSchedule", icon: Calendar, href: "/agenda" },
] as const;

export function EcopetAIAssistant() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string | null>(null);

  const send = useCallback(async () => {
    if (!message.trim() || loading || unavailable) return;
    const userMsg = message.trim();
    setMessage("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await api<{
        success?: boolean;
        data?: { reply?: string; content?: string };
        reply?: string;
        content?: string;
        error?: { code?: string; message?: string };
      }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg, type: "general" }),
      });

      if (res.success === false || isAiNotConfiguredErrorCode(res.error?.code)) {
        setUnavailable(true);
        setUnavailableMessage(res.error?.message ?? t("empty.ai.unavailable"));
        setMessages((m) => m.slice(0, -1));
        setMessage(userMsg);
        return;
      }

      const content = (res.data?.content ?? res.data?.reply ?? res.content ?? res.reply)?.trim();
      if (!content) {
        setError(t("empty.ai.unavailable"));
        setMessages((m) => m.slice(0, -1));
        setMessage(userMsg);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content }]);
    } catch (err) {
      const code = err instanceof ApiRequestError ? err.code : undefined;
      const msg = err instanceof Error ? err.message : t("empty.ai.unavailable");
      if (isAiNotConfiguredErrorCode(code)) {
        setUnavailable(true);
        setUnavailableMessage(msg);
        setMessages((m) => m.slice(0, -1));
        setMessage(userMsg);
      } else {
        setError(msg);
        setMessages((m) => m.slice(0, -1));
        setMessage(userMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [message, loading, unavailable, t]);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            type="button"
            onClick={() => setOpen(true)}
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-ecopet-dark/30 transition-transform hover:scale-105 lg:bottom-6"
            aria-label={t("empty.ai.openLabel")}
          >
            <EcopetSymbol variant="accent" size={56} animated="glow" className="rounded-2xl shadow-lg" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:bg-black/20"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-[min(520px,calc(100vh-8rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-ecopet-gray/10 bg-white shadow-2xl dark:bg-[#0f1419] lg:bottom-6"
            >
              <header className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-ecopet-green" />
                  <span className="font-display font-bold">ECOPET IA</span>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label={t("common.cancel")}>
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {unavailable && (
                  <AiUnavailableBanner message={unavailableMessage ?? undefined} />
                )}
                {messages.length === 0 && !unavailable ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-ecopet-gray">
                    <EcopetSymbol variant="accent" size={48} className="mb-3" />
                    <p>{t("empty.ai.noHistory")}</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={cn("rounded-xl px-3 py-2 text-sm", m.role === "user" ? "ml-8 bg-ecopet-green/10" : "mr-8 bg-ecopet-gray/10")}>
                      {m.content}
                    </div>
                  ))
                )}
                {loading && (
                  <p className="text-sm text-ecopet-gray" role="status">
                    Gerando resposta…
                  </p>
                )}
                {error && (
                  <p className="text-xs text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="border-t p-3 space-y-2">
                <p className="text-[10px] leading-snug text-ecopet-gray">
                  {AI_SAFETY_DISCLAIMER["pt-BR"]}
                </p>
                <div className="flex flex-wrap gap-1">
                  {QUICK_COMMANDS.map(({ labelKey, icon: Icon, href }) => (
                    <Link key={labelKey} href={href} className="flex items-center gap-1 rounded-full bg-ecopet-green/10 px-2 py-1 text-[10px] font-semibold text-ecopet-green">
                      <Icon className="h-3 w-3" /> {t(labelKey)}
                    </Link>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void send()}
                    placeholder={unavailable ? "IA indisponível" : t("empty.ai.placeholder")}
                    disabled={loading || unavailable}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
                  />
                  <Button size="icon" onClick={() => void send()} disabled={loading || unavailable || !message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <Link href="/ia" className="flex items-center justify-center gap-1 text-xs text-ecopet-green">
                  {t("empty.ai.fullPage")} <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
