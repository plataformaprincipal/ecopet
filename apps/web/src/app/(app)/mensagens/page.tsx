import { redirect } from "next/navigation";

/** Alias público para /dashboard/messages */
export default function MensagensPage() {
  redirect("/dashboard/messages");
}
