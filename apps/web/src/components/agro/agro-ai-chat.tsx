"use client";

import { X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgroStore } from "@/store/agro-store";
import { AI_QUICK_QUESTIONS } from "@/lib/agro/config";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AgroAiChat() {
  const { aiChatOpen, setAiChatOpen, aiMessages, sendAiMessage } = useAgroStore();
  const [input, setInput] = useState("");

  function handleSend(text?: string) {
    const msg = text ?? input.trim();
    if (!msg) return;
    sendAiMessage(msg);
    setInput("");
  }

  return (
    <>
      <div
        className={cn("fixed inset-0 z-50 bg-black/30 transition-opacity lg:bg-transparent lg:pointer-events-none", aiChatOpen ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setAiChatOpen(false)}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ecopet-green/20 bg-white shadow-2xl transition-transform duration-300 dark:bg-[#0f1419]",
          aiChatOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-ecopet-gray/10 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ecopet-yellow" />
            <h2 className="font-display font-bold">Pergunte à IA Agro</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setAiChatOpen(false)}><X className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {aiMessages.map((m) => (
            <div key={m.id} className={cn("max-w-[90%] rounded-2xl p-3 text-sm", m.role === "user" ? "ml-auto bg-ecopet-green text-white" : "bg-ecopet-gray/10")}>
              {m.content}
            </div>
          ))}
        </div>
        <div className="border-t border-ecopet-gray/10 p-4">
          <p className="mb-2 text-xs font-semibold text-ecopet-gray">Perguntas rápidas</p>
          <div className="mb-3 flex flex-wrap gap-1">
            {AI_QUICK_QUESTIONS.slice(0, 4).map((q) => (
              <button key={q} type="button" onClick={() => handleSend(q)} className="rounded-full bg-ecopet-green/10 px-2 py-1 text-[10px] hover:bg-ecopet-green/20">{q}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Digite sua pergunta..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
            <Button onClick={() => handleSend()}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>
    </>
  );
}
