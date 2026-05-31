import { GestorModerationPanel } from "@/components/gestor/gestor-moderation";
import { GestorPageHeader } from "@/components/gestor/gestor-shell";

export default function GestorSocialPage() {
  return (
    <>
      <GestorPageHeader title="Rede Social — Moderação" description="Denúncias, spam, maus-tratos, conteúdo inadequado — IA + revisão humana" />
      <GestorModerationPanel />
    </>
  );
}
