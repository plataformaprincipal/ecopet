import { create } from "zustand";
import type { AiAgroMessage, AlertPriority } from "@/lib/agro/types";
import { AI_MOCK_RESPONSES } from "@/lib/agro/config";

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
  selectedFarmId: "farm1",
  aiChatOpen: false,
  aiMessages: [
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou a IA Agro Inteligente ECOPET. Posso analisar produtividade, prever safras, recomendar irrigação, detectar pragas e otimizar custos. Como posso ajudar?",
      timestamp: new Date().toISOString(),
    },
  ],
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
    const response =
      AI_MOCK_RESPONSES[content] ??
      `Analisando dados da Fazenda ECOPET Verde... Com base nos sensores IoT, drones e modelos ML ativos, identifiquei oportunidades de otimização. Para "${content}", recomendo verificar o dashboard de monitoramento e os alertas críticos ativos.`;
    const assistantMsg: AiAgroMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: response,
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
