import { create } from "zustand";

type AssistantState = {
  /** Prompt enviado a partir do feed/produtos/serviços para o assistente. */
  pendingPrompt: string | null;
  /** Indica que o painel mobile da IA deve abrir. */
  requestOpen: number;
  ask: (prompt: string) => void;
  consumePrompt: () => string | null;
};

export const useAssistantStore = create<AssistantState>((set, get) => ({
  pendingPrompt: null,
  requestOpen: 0,
  ask: (prompt) => set((s) => ({ pendingPrompt: prompt, requestOpen: s.requestOpen + 1 })),
  consumePrompt: () => {
    const prompt = get().pendingPrompt;
    set({ pendingPrompt: null });
    return prompt;
  },
}));
