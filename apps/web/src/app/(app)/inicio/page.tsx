import { redirect } from "next/navigation";

/** /inicio redireciona para o feed canônico (Etapa 11). */
export default function InicioPage() {
  redirect("/feed");
}
