import { redirect } from "next/navigation";

/** @deprecated Use /dashboard/messages */
export default function SocialMensagensPage() {
  redirect("/dashboard/messages");
}
