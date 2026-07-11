export type AiLocale = "pt-BR" | "en-US" | "es-ES";

export const AI_SAFETY_DISCLAIMER: Record<AiLocale, string> = {
  "pt-BR":
    "A IA EcoPet não substitui médicos-veterinários, zootecnistas, adestradores, especialistas ou outros profissionais qualificados. As informações fornecidas possuem caráter informativo e de apoio à tomada de decisão.",
  "en-US":
    "EcoPet AI does not replace veterinarians, animal scientists, trainers, specialists, or other qualified professionals. The information provided is for informational and decision-support purposes only.",
  "es-ES":
    "La IA de EcoPet no sustituye a veterinarios, zootecnistas, adiestradores, especialistas u otros profesionales calificados. La información proporcionada tiene carácter informativo y de apoyo a la toma de decisiones.",
};

export function normalizeLocale(locale?: string | null): AiLocale {
  if (!locale) return "pt-BR";
  const l = locale.toLowerCase();
  if (l.startsWith("en")) return "en-US";
  if (l.startsWith("es")) return "es-ES";
  return "pt-BR";
}
