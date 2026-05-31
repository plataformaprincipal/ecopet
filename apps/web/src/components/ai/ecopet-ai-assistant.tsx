"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Sparkles, Search, PawPrint, ShoppingBag, Stethoscope,
  Compass, Calendar, MessageSquare, ChevronRight,
} from "lucide-react";
import { EcopetSymbol } from "@/components/brand/ecopet-symbol";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUICK_COMMANDS = [
  { label: "Recomendar produtos", icon: ShoppingBag, href: "/marketplace" },
  { label: "Encontrar veterinário", icon: Stethoscope, href: "/veterinarios" },
  { label: "Explorar serviços", icon: Compass, href: "/explorar" },
  { label: "Saúde do meu pet", icon: PawPrint, href: "/health" },
  { label: "Agendar consulta", icon: Calendar, href: "/agenda" },
];

const MOCK_HISTORY = [
  { role: "assistant", content: "Olá! Sou a ECOPET IA — seu assistente inteligente. Como posso ajudar você e seu pet hoje?" },
];

export function EcopetAIAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(MOCK_HISTORY);
  const [search, setSearch] = useState("");

  const send = useCallback(() => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage("");
    setMessages((m) => [
      ...m,
      { role: "user", content: userMsg },
      {
        role: "assistant",
        content: "Estou preparada para responder dúvidas, recomendar produtos, serviços e veterinários. Em breve com IA completa conectada à API ECOPET.",
      },
    ]);
  }, [message]);

  return (
    <>
      {/* Bolha flutuante com símbolo oficial */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            type="button"
            onClick={() => setOpen(true)}
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-ecopet-dark/30 transition-transform hover:scale-105 lg:bottom-6"
            aria-label="Abrir ECOPET IA"
          >
            <EcopetSymbol variant="accent" size={56} animated="glow" className="rounded-2xl shadow-lg" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Painel expandido */}
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
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-[min(560px,calc(100vh-8rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[16px] border border-ecopet-gray/10 bg-white shadow-2xl dark:border-white/10 dark:bg-ecopet-dark-card lg:bottom-6"
              role="dialog"
              aria-label="ECOPET IA Assistente"
            >
              {/* Header */}
              <div className="gradient-ecopet-accent flex items-center gap-3 px-4 py-3 text-white">
                <EcopetSymbol variant="light" size={36} animated="pulse" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-extrabold">ECOPET IA</p>
                  <p className="text-[10px] opacity-80">Assistente inteligente universal</p>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Busca global */}
              <div className="border-b border-ecopet-gray/10 px-3 py-2 dark:border-white/10">
                <div className="flex items-center gap-2 rounded-xl bg-ecopet-gray/5 px-3 py-2 dark:bg-white/5">
                  <Search className="h-4 w-4 text-ecopet-gray" />
                  <input
                    type="search"
                    placeholder="Pesquisar na ECOPET..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              {/* Atalhos */}
              <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
                {QUICK_COMMANDS.map((cmd) => (
                  <Link
                    key={cmd.label}
                    href={cmd.href}
                    onClick={() => setOpen(false)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-ecopet-green/20 bg-ecopet-green/5 px-3 py-1.5 text-xs font-medium text-ecopet-green"
                  >
                    <cmd.icon className="h-3 w-3" />
                    {cmd.label}
                  </Link>
                ))}
              </div>

              {/* Chat */}
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-ecopet-green text-white"
                        : "bg-ecopet-gray/10 dark:bg-white/10"
                    )}>
                      {msg.role === "assistant" && (
                        <Sparkles className="mb-1 h-3 w-3 text-ecopet-yellow" />
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-ecopet-gray/10 p-3 dark:border-white/10">
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Pergunte qualquer coisa..."
                    className="flex-1 rounded-xl border border-ecopet-gray/20 px-3 py-2.5 text-sm outline-none focus:border-ecopet-green dark:bg-white/5"
                  />
                  <Button size="icon" onClick={send} className="shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <Link href="/ia" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-center gap-1 text-xs text-ecopet-green">
                  Abrir IA completa <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
