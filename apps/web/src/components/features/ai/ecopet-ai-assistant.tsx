"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Sparkles, Search, PawPrint, ShoppingBag, Stethoscope,
  Compass, Calendar, MessageSquare, ChevronRight,
} from "lucide-react";
import { EcopetSymbol } from "@/components/shared/brand/ecopet-symbol";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const send = useCallback(async () => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setMessage("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await api<{ reply: string }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg, type: "general" }),
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t("empty.ai.unavailable") },
      ]);
    } finally {
      setLoading(false);
    }
  }, [message, loading, t]);

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
                {messages.length === 0 ? (
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
              </div>

              <div className="border-t p-3 space-y-2">
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
                    placeholder={t("empty.ai.placeholder")}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm"
                  />
                  <Button size="icon" onClick={() => void send()} disabled={loading || !message.trim()}>
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
