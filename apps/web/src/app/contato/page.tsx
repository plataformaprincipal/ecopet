import type { Metadata } from "next";
import { PublicContactForm } from "@/components/features/foundation/public-contact-form";

export const metadata: Metadata = {
  title: "Contato | EccoPet",
  description: "Fale com o EccoPet — formulário público protegido contra spam.",
};

export default function ContatoPage() {
  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-lg px-4 py-12">
      <PublicContactForm />
    </main>
  );
}
