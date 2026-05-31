import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

/** Compatibilidade: /marketplace/[id] → /marketplace/produto/[id] */
export default async function LegacyProductRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/marketplace/produto/${id}`);
}
