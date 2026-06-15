import { redirect } from "next/navigation";

export default function LegacyTermosRedirect() {
  redirect("/legal/termos");
}
