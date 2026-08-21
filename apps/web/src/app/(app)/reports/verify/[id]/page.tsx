import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const report = await prisma.aIReport.findUnique({
    where: { id },
    select: { id: true, userId: true, createdAt: true, type: true, verificationHash: true },
  });
  if (!report) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <h1 className="text-2xl font-semibold">Documento não encontrado</h1>
      </main>
    );
  }
  const owned = user?.id === report.userId;
  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-semibold">Verificação EccoPet AI</h1>
      <p className="mt-4 text-sm text-muted-foreground">ID: {report.id}</p>
      <p className="text-sm text-muted-foreground">Emitido em {report.createdAt.toLocaleString("pt-BR")}</p>
      <p className="mt-4 text-sm">
        {owned
          ? "Este documento pertence à sua conta. O conteúdo completo está no histórico do pet."
          : "Documento válido. O conteúdo clínico só é exibido ao titular autorizado."}
      </p>
    </main>
  );
}
