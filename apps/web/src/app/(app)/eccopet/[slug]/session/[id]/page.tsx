import type { Metadata } from "next";
import { AiWorkspace } from "@/components/features/ai-commerce/workspace";

export const metadata: Metadata = {
  title: "Sessão EccoPet AI",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;
  return <AiWorkspace executionId={id} />;
}
