import { create } from "zustand";
import type { AiAgroMessage, AlertPriority } from "@/lib/agro/types";

interface AgroState {
  selectedFarmId: string;
  aiChatOpen: boolean;
  aiMessages: AiAgroMessage[];
  alertFilter: AlertPriority | "all";
  robotCommands: Record<string, string>;

  setSelectedFarm: (id: string) => void;
  setAiChatOpen: (open: boolean) => void;
  sendAiMessage: (content: string) => void;
  setAlertFilter: (f: AlertPriority | "all") => void;
  sendRobotCommand: (robotId: string, command: string) => void;
}

export const useAgroStore = create<AgroState>((set, get) => ({
  selectedFarmId: "",
  aiChatOpen: false,
  aiMessages: [] as AiAgroMessage[],
  alertFilter: "all",
  robotCommands: {},

  setSelectedFarm: (id) => set({ selectedFarmId: id }),
  setAiChatOpen: (open) => set({ aiChatOpen: open }),

  sendAiMessage: (content) => {
    const userMsg: AiAgroMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    const assistantMsg: AiAgroMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "Nenhum dado agro disponível no momento. Cadastre fazendas e sensores para habilitar recomendações.",
      timestamp: new Date().toISOString(),
    };
    set((s) => ({ aiMessages: [...s.aiMessages, userMsg, assistantMsg] }));
  },

  setAlertFilter: (f) => set({ alertFilter: f }),
  sendRobotCommand: (robotId, command) =>
    set((s) => ({
      robotCommands: { ...s.robotCommands, [robotId]: `${command} — ${new Date().toLocaleTimeString("pt-BR")}` },
    })),
}));
