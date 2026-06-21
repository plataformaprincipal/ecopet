import { redirect } from "next/navigation";

/** Alias legado → rota canônica de recuperação */
export default function EsqueciSenhaPage() {
  redirect("/recuperar-senha");
}
