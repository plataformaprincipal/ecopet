"use client";

import { AgroAiChat } from "./agro-ai-chat";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgroStore } from "@/store/agro-store";

export function AgroShell({ children }: { children: React.ReactNode }) {
  const setAiChatOpen = useAgroStore((s) => s.setAiChatOpen);

  return (
    <>
      {children}
      <AgroAiChat />
      <Button
        className="fixed bottom-24 right-4 z-40 h-14 gap-2 rounded-full shadow-lg lg:bottom-8"
        onClick={() => setAiChatOpen(true)}
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden sm:inline">IA Agro</span>
      </Button>
    </>
  );
}
