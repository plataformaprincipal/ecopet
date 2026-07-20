/**
 * Meu Pet IA — resumo seguro sem diagnóstico/prescrição.
 * Minimiza dados médicos enviáveis a modelos externos.
 */
import "server-only";

import { readPetOverview } from "@/lib/ai/modules/services/domain-reads";
import { assertAiFlag } from "../feature-flags";

export type MyPetAiSummary = {
  petsCount: number;
  pets: Array<{ id: string; name: string; species: string | null }>;
  upcomingCount: number;
  vaccineAlerts: number;
  medicationReminders: number;
  reminderCount: number;
  highlights: string[];
  vetQuestionDrafts: string[];
  safetyNotices: string[];
  /** Bloco mínimo para prompt — sem prontuário integral */
  promptSafeBlock: string;
};

export async function buildMyPetAiSummary(userId: string): Promise<MyPetAiSummary> {
  assertAiFlag("mypet_ai");
  const overview = await readPetOverview(userId);

  const highlights: string[] = [];
  if (overview.petsCount === 0) {
    highlights.push("Nenhum pet cadastrado ainda — complete o perfil em Meu Pet.");
  } else {
    highlights.push(`${overview.petsCount} pet(s) no perfil.`);
  }
  if (overview.upcomingAppointments.length) {
    highlights.push(`${overview.upcomingAppointments.length} compromisso(s) próximos na agenda.`);
  }
  if (overview.vaccinesPending.length) {
    highlights.push(`${overview.vaccinesPending.length} vacina(s) com retorno cadastrado.`);
  }
  if (overview.medications.length) {
    highlights.push(`${overview.medications.length} medicamento(s) em acompanhamento cadastrado.`);
  }

  const vetQuestionDrafts = [
    "Quais vacinas estão em dia no meu cadastro e o que falta atualizar?",
    "Como organizar a rotina de alimentação e passeios com base na agenda?",
    "Quais sinais de urgência devo observar antes de buscar atendimento presencial?",
  ];

  const safetyNotices = [
    "A EcoPet IA não diagnostica, não prescreve e não substitui atendimento veterinário.",
    "Em emergência (dificuldade respiratória, convulsão, trauma, intoxicação), busque atendimento imediato.",
    "Dados médicos integrais não são enviados à OpenAI; apenas resumos mínimos autorizados.",
  ];

  const promptSafeBlock = [
    `Pets: ${overview.pets.map((p) => `${p.name} (${p.species ?? "n/d"})`).join(", ") || "nenhum"}`,
    `Agenda próxima: ${overview.upcomingAppointments.length} item(ns)`,
    `Vacinas com retorno: ${overview.vaccinesPending.map((v) => v.name).join(", ") || "nenhuma listada"}`,
    `Medicamentos cadastrados (somente nomes): ${overview.medications.map((m) => m.name).join(", ") || "nenhum"}`,
    "Regra: não diagnosticar nem prescrever.",
  ].join("\n");

  return {
    petsCount: overview.petsCount,
    pets: overview.pets,
    upcomingCount: overview.upcomingAppointments.length,
    vaccineAlerts: overview.vaccinesPending.length,
    medicationReminders: overview.medications.length,
    reminderCount: overview.reminders.length,
    highlights,
    vetQuestionDrafts,
    safetyNotices,
    promptSafeBlock,
  };
}
