import "server-only";
import { prisma } from "@/lib/prisma";
import { getProductDefBySku } from "./catalog";
import { searchMarketplaceProductsFromQueries } from "./marketplace-search";

function queriesFrom(output: Record<string, unknown>, input: Record<string, unknown> | null) {
  const fromOutput = Array.isArray(output.compatibleProductQueries)
    ? output.compatibleProductQueries.map(String)
    : [];
  const fromInput = [input?.diet, input?.goal, input?.restrictions].filter(Boolean).map(String);
  return [...fromOutput, ...fromInput].filter((q) => q.trim().length >= 2);
}

export async function extrasForExecution(params: {
  userId: string;
  petId: string;
  sku: string;
  capabilityId: string;
  output: Record<string, unknown> | null;
  input: Record<string, unknown> | null;
}) {
  const def = getProductDefBySku(params.sku);
  const kind = def?.workspaceKind;
  const [weights, previous] = await Promise.all([
    prisma.petWeightRecord.findMany({
      where: { petId: params.petId },
      orderBy: { recordedAt: "asc" },
      take: 40,
      select: { weight: true, recordedAt: true },
    }).catch(() => []),
    prisma.aIExecution.findMany({
      where: { userId: params.userId, petId: params.petId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: { capabilityId: true, completedAt: true, structuredOutput: true, entitlement: { select: { sku: true } } },
    }),
  ]);

  const weightSeries = weights.map((w) => ({
    label: w.recordedAt.toLocaleDateString("pt-BR"),
    value: w.weight,
  }));
  if (params.input?.weight) {
    const n = Number(params.input.weight);
    if (!Number.isNaN(n)) weightSeries.push({ label: "agora", value: n });
  }

  const previousCheckup = previous.find((p) => p.capabilityId.includes("checkup"))?.structuredOutput as
    | Record<string, unknown>
    | undefined;

  const examSeries: Array<{ name: string; points: Array<{ label: string; value: number; unit?: string }> }> = [];
  if (kind === "exams") {
    const byName = new Map<string, Array<{ label: string; value: number; unit?: string }>>();
    for (const exec of previous.filter((p) => p.capabilityId.includes("exams") || p.capabilityId === "eccolab")) {
      const out = (exec.structuredOutput ?? {}) as Record<string, unknown>;
      const markers = Array.isArray(out.markers) ? (out.markers as Array<Record<string, unknown>>) : [];
      const date = exec.completedAt?.toLocaleDateString("pt-BR") ?? "";
      for (const m of markers) {
        const num = Number(String(m.value).replace(",", "."));
        if (Number.isNaN(num)) continue;
        const name = String(m.name);
        const arr = byName.get(name) ?? [];
        arr.push({ label: date, value: num, unit: m.unit ? String(m.unit) : undefined });
        byName.set(name, arr);
      }
    }
    for (const [name, points] of byName) {
      if (points.length >= 2) examSeries.push({ name, points });
    }
  }

  let marketplaceProducts: Awaited<ReturnType<typeof searchMarketplaceProductsFromQueries>> = [];
  if (kind === "nutri" && params.output) {
    marketplaceProducts = await searchMarketplaceProductsFromQueries(queriesFrom(params.output, params.input));
  }

  return {
    marketplaceProducts,
    weightSeries,
    examSeries,
    previousCheckup: previousCheckup ?? null,
  };
}
