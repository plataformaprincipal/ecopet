import { BubisChat } from "@/components/bubis/bubis-chat";

export const metadata = {
  title: "Emergência veterinária — Bubis | EccoPet",
  description: "Triagem veterinária por inteligência artificial com a Bubis. Não substitui atendimento presencial.",
  robots: { index: false },
};

export default function EmergenciaPage() {
  return <BubisChat />;
}
