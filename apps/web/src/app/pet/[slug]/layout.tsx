import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil público do pet · ECOPET",
  description:
    "Página pública ECOPET ID: informações do pet, status de adoção e contato em caso de pet perdido.",
  openGraph: {
    title: "Perfil público do pet · ECOPET",
    description:
      "Conheça este pet no ECOPET: dados, status de adoção e contato em caso de pet perdido.",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "Perfil público do pet · ECOPET",
    description:
      "Conheça este pet no ECOPET: dados, status de adoção e contato em caso de pet perdido.",
  },
};

export default function PublicPetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
