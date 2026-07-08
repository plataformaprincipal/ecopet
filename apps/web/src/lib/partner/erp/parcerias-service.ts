import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { kpi } from "./types";
import { loadPartnerErpStore } from "./store";

type PartnerParceriasStore = {
  ngos: Array<Record<string, unknown>>;
  campaigns: Array<Record<string, unknown>>;
  sponsoredAnimals: Array<Record<string, unknown>>;
  donations: Array<Record<string, unknown>>;
  freeServices: Array<Record<string, unknown>>;
  socialDiscounts: Array<Record<string, unknown>>;
  jointEvents: Array<Record<string, unknown>>;
  contracts: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
};

const EMPTY_PARCERIAS: PartnerParceriasStore = {
  ngos: [],
  campaigns: [],
  sponsoredAnimals: [],
  donations: [],
  freeServices: [],
  socialDiscounts: [],
  jointEvents: [],
  contracts: [],
  history: [],
};

export async function getPartnerParceriasModule(
  prisma: PrismaClient,
  partnerId: string
): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "parcerias", EMPTY_PARCERIAS);

  const [followedNgos, followerNgos, freeServices, discountedProducts, petsSponsored] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followerId: partnerId, following: { role: "ONG" } },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            ongProfile: { select: { ongName: true, city: true, state: true, verificationStatus: true } },
          },
        },
      },
      take: 30,
    }),
    prisma.userFollow.findMany({
      where: { followingId: partnerId, follower: { role: "ONG" } },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            ongProfile: { select: { ongName: true, city: true, state: true, verificationStatus: true } },
          },
        },
      },
      take: 30,
    }),
    prisma.service.findMany({
      where: { providerId: partnerId, price: 0, isActive: true, deletedAt: null },
      select: { id: true, name: true, category: true, price: true, status: true },
      take: 20,
    }),
    prisma.product.findMany({
      where: {
        sellerId: partnerId,
        deletedAt: null,
        comparePrice: { not: null },
        status: "ACTIVE",
      },
      select: { id: true, name: true, price: true, comparePrice: true },
      take: 20,
    }),
    prisma.pet.findMany({
      where: {
        ongId: { not: null },
        appointments: { some: { partnerId, status: { in: ["COMPLETED", "CONFIRMED"] } } },
      },
      select: {
        id: true,
        name: true,
        ongId: true,
        ong: { select: { name: true, ongProfile: { select: { ongName: true } } } },
      },
      take: 20,
    }),
  ]);

  const ngoMap = new Map<string, Record<string, unknown>>();

  for (const f of followedNgos) {
    const u = f.following;
    ngoMap.set(u.id, {
      id: u.id,
      ong: u.ongProfile?.ongName ?? u.name ?? "ONG",
      contato: u.email ?? "—",
      status: u.ongProfile?.verificationStatus ?? "PENDING",
      relacao: "seguindo",
      cidade: u.ongProfile?.city ?? "—",
      beneficio: "—",
      contrato: "—",
      responsavel: "—",
    });
  }

  for (const f of followerNgos) {
    const u = f.follower;
    if (ngoMap.has(u.id)) continue;
    ngoMap.set(u.id, {
      id: u.id,
      ong: u.ongProfile?.ongName ?? u.name ?? "ONG",
      contato: u.email ?? "—",
      status: u.ongProfile?.verificationStatus ?? "PENDING",
      relacao: "seguidor",
      cidade: u.ongProfile?.city ?? "—",
      beneficio: "—",
      contrato: "—",
      responsavel: "—",
    });
  }

  for (const n of store.ngos) {
    const id = String(n.ongId ?? n.id ?? "");
    if (id) {
      ngoMap.set(id, {
        id,
        ong: n.nome ?? n.ong ?? "ONG",
        contato: n.contato ?? "—",
        status: n.status ?? "ativo",
        relacao: n.relacao ?? "parceria",
        cidade: n.cidade ?? "—",
        beneficio: n.beneficio ?? "—",
        contrato: n.contrato ?? "—",
        responsavel: n.responsavel ?? "—",
      });
    }
  }

  const ngoRows = [...ngoMap.values()];
  const freeServiceRows =
    store.freeServices.length > 0
      ? store.freeServices
      : freeServices.map((s) => ({
          id: s.id,
          servico: s.name,
          categoria: s.category,
          preco: s.price,
          status: s.status,
        }));

  const discountRows =
    store.socialDiscounts.length > 0
      ? store.socialDiscounts
      : discountedProducts.map((p) => ({
          id: p.id,
          produto: p.name,
          preco: p.price,
          precoDe: p.comparePrice,
          desconto: p.comparePrice
            ? `${Math.round((1 - p.price / p.comparePrice) * 100)}%`
            : "—",
        }));

  const sponsoredRows =
    store.sponsoredAnimals.length > 0
      ? store.sponsoredAnimals
      : petsSponsored.map((p) => ({
          id: p.id,
          animal: p.name,
          ong: p.ong?.ongProfile?.ongName ?? p.ong?.name ?? "—",
          ongId: p.ongId,
        }));

  const activePartnerships = ngoRows.filter((n) => n.status === "ativo" || n.status === "APPROVED").length;

  return {
    moduleId: "parcerias",
    title: "Parcerias com ONGs",
    kpis: [
      kpi("ngos", "ONGs parceiras", ngoRows.length),
      kpi("active", "Parcerias ativas", activePartnerships),
      kpi("campaigns", "Campanhas apoiadas", store.campaigns.length),
      kpi("sponsored", "Animais patrocinados", sponsoredRows.length),
      kpi("donations", "Doações realizadas", store.donations.length),
      kpi("free-services", "Serviços gratuitos", freeServiceRows.length),
      kpi("discounts", "Descontos sociais", discountRows.length),
      kpi("events", "Eventos conjuntos", store.jointEvents.length),
      kpi("contracts", "Contratos", store.contracts.length),
    ],
    tables: [
      { id: "ngos", label: "ONGs parceiras", rows: ngoRows },
      { id: "campaigns", label: "Campanhas apoiadas", rows: store.campaigns },
      { id: "sponsored", label: "Animais patrocinados", rows: sponsoredRows },
      { id: "donations", label: "Doações realizadas", rows: store.donations },
      { id: "free-services", label: "Serviços gratuitos", rows: freeServiceRows },
      { id: "discounts", label: "Descontos sociais", rows: discountRows },
      { id: "events", label: "Eventos conjuntos", rows: store.jointEvents },
      { id: "contracts", label: "Contratos", rows: store.contracts },
      { id: "history", label: "Histórico de colaboração", rows: store.history },
    ],
    tabs: [
      { id: "ngos", label: "ONGs" },
      { id: "campaigns", label: "Campanhas" },
      { id: "sponsored", label: "Patrocínios" },
      { id: "donations", label: "Doações" },
      { id: "free-services", label: "Serviços" },
      { id: "discounts", label: "Descontos" },
      { id: "events", label: "Eventos" },
      { id: "contracts", label: "Contratos" },
      { id: "history", label: "Histórico" },
    ],
    disclaimer:
      ngoRows.length === 0 && store.campaigns.length === 0
        ? "Conecte-se com ONGs na rede social ou registre parcerias via POST /api/partner/erp/parcerias."
        : undefined,
  };
}
