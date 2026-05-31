import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";
import { prisma } from "@ecopet/database";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1),
  petId: z.string().optional(),
  type: z.enum(["triage", "behavior", "nutrition", "general"]).default("general"),
});

const SYSTEM_PROMPT = `Você é a IA ECOPET, assistente virtual especializada em pets.
Seja empática, profissional e clara. Responda em português brasileiro.
IMPORTANTE: Sempre inclua no final da resposta: "⚠️ A IA ECOPET não substitui um veterinário. Em caso de emergência, procure atendimento profissional imediatamente."
Forneça orientações gerais, nunca diagnósticos definitivos.`;

router.post("/chat", async (req: AuthRequest, res, next) => {
  try {
    const { message, petId, type } = chatSchema.parse(req.body);

    let petContext = "";
    if (petId) {
      const pet = await prisma.pet.findFirst({
        where: { id: petId, ownerId: req.userId },
        include: { allergies: true, medications: true },
      });
      if (pet) {
        petContext = `\nContexto do pet: ${pet.name}, ${pet.species}, raça ${pet.breed || "SRD"}, peso ${pet.weight || "?"}kg. Alergias: ${pet.allergies.map((a) => a.allergen).join(", ") || "nenhuma"}.`;
      }
    }

    const typePrompts: Record<string, string> = {
      triage: "Modo triagem: avalie sintomas descritos e sugira nível de urgência (baixo/médio/alto).",
      behavior: "Modo comportamento: analise comportamentos descritos e sugira abordagens positivas.",
      nutrition: "Modo alimentação: sugira orientações nutricionais gerais baseadas no perfil.",
      general: "Modo geral: responda dúvidas sobre cuidados com pets.",
    };

    let reply: string;

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + typePrompts[type] + petContext },
          { role: "user", content: message },
        ],
        max_tokens: 800,
      });
      reply = completion.choices[0]?.message?.content || "Desculpe, não consegui processar sua solicitação.";
    } else {
      reply = `[Modo demonstração — configure OPENAI_API_KEY para IA completa]

Olá! Analisei sua mensagem sobre "${message.slice(0, 50)}..."${petContext}

Com base nas informações fornecidas, recomendo monitorar os sintomas nas próximas 24h e manter hidratação adequada. Para ${type === "nutrition" ? "alimentação" : "cuidados gerais"}, consulte sempre um profissional.

⚠️ A IA ECOPET não substitui um veterinário. Em caso de emergência, procure atendimento profissional imediatamente.`;
    }

    await prisma.aiSession.create({
      data: {
        userId: req.userId!,
        petId,
        type,
        messages: [{ role: "user", content: message }, { role: "assistant", content: reply }],
      },
    });

    res.json({ reply, disclaimer: "A IA ECOPET não substitui um veterinário." });
  } catch (e) {
    next(e);
  }
});

export default router;
