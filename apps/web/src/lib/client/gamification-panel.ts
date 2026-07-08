import type { PrismaClient } from "@prisma/client";

export type GamificationMission = {
  id: string;
  title: string;
  description: string;
  points: number;
  progress: number;
  target: number;
  completed: boolean;
};

export type GamificationBadge = {
  id: string;
  name: string;
  earned: boolean;
  earnedAt: string | null;
};

export type ClientGamificationPanel = {
  profile: { points: number; level: number; rank: number | null; nextLevelAt: number };
  missions: GamificationMission[];
  badges: GamificationBadge[];
  challenges: Array<{ id: string; title: string; dueAt: string | null }>;
  personalRank: { position: number | null; label: string };
};

const BADGE_DEFS = [
  { id: "first_pet", name: "Primeiro pet" },
  { id: "first_order", name: "Primeira compra" },
  { id: "health_guardian", name: "Guardião da saúde" },
  { id: "routine_master", name: "Mestre da rotina" },
  { id: "iot_pioneer", name: "Pioneiro IoT" },
  { id: "wellness_hero", name: "Herói do bem-estar" },
] as const;

export async function buildClientGamificationPanel(
  prisma: PrismaClient,
  userId: string
): Promise<ClientGamificationPanel> {
  const pets = await prisma.pet.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true },
  });
  const petIds = pets.map((p) => p.id);

  const [profile, ordersCount, vaccinesCount, remindersDone, devicesCount, wellnessReminders] = await Promise.all([
    prisma.gamificationProfile.findUnique({ where: { userId } }),
    prisma.order.count({ where: { userId } }),
    petIds.length ? prisma.vaccination.count({ where: { petId: { in: petIds } } }) : Promise.resolve(0),
    petIds.length
      ? prisma.petReminder.count({ where: { petId: { in: petIds }, status: "DONE" } })
      : Promise.resolve(0),
    prisma.iotDevice.count({ where: { userId } }),
    petIds.length
      ? prisma.petReminder.findMany({
          where: { petId: { in: petIds }, status: "PENDING" },
          orderBy: { dueAt: "asc" },
          take: 5,
          select: { id: true, title: true, dueAt: true },
        })
      : Promise.resolve([]),
  ]);

  const points = profile?.points ?? 0;
  const level = profile?.level ?? 1;
  const nextLevelAt = level * 500;

  const storedBadges = (profile?.badges ?? {}) as Record<string, { earnedAt?: string }>;

  const earnedChecks: Record<string, boolean> = {
    first_pet: pets.length > 0,
    first_order: ordersCount > 0,
    health_guardian: vaccinesCount >= 3,
    routine_master: remindersDone >= 10,
    iot_pioneer: devicesCount > 0,
    wellness_hero: points >= 1000,
  };

  const badges: GamificationBadge[] = BADGE_DEFS.map((b) => ({
    id: b.id,
    name: b.name,
    earned: earnedChecks[b.id] ?? false,
    earnedAt: storedBadges[b.id]?.earnedAt ?? (earnedChecks[b.id] ? new Date().toISOString() : null),
  }));

  const missions: GamificationMission[] = [
    {
      id: "register_pet",
      title: "Cadastrar um pet",
      description: "Adicione seu primeiro ou próximo pet",
      points: 100,
      progress: Math.min(pets.length, 1),
      target: 1,
      completed: pets.length > 0,
    },
    {
      id: "complete_vaccine",
      title: "Registrar vacina",
      description: "Mantenha a carteira de vacinação atualizada",
      points: 150,
      progress: Math.min(vaccinesCount, 1),
      target: 1,
      completed: vaccinesCount > 0,
    },
    {
      id: "first_purchase",
      title: "Primeira compra",
      description: "Faça um pedido no marketplace",
      points: 200,
      progress: Math.min(ordersCount, 1),
      target: 1,
      completed: ordersCount > 0,
    },
    {
      id: "routine_streak",
      title: "Rotina em dia",
      description: "Complete 5 lembretes de rotina",
      points: 250,
      progress: Math.min(remindersDone, 5),
      target: 5,
      completed: remindersDone >= 5,
    },
    {
      id: "connect_device",
      title: "Conectar IoT",
      description: "Vincule um dispositivo inteligente",
      points: 300,
      progress: Math.min(devicesCount, 1),
      target: 1,
      completed: devicesCount > 0,
    },
  ];

  return {
    profile: { points, level, rank: profile?.rank ?? null, nextLevelAt },
    missions,
    badges,
    challenges: wellnessReminders.map((r) => ({
      id: r.id,
      title: r.title,
      dueAt: r.dueAt.toISOString(),
    })),
    personalRank: {
      position: profile?.rank ?? null,
      label: profile?.rank ? `Você está na posição #${profile.rank}` : "Ranking pessoal em construção",
    },
  };
}
