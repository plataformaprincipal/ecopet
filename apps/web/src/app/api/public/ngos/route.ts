import { AccountStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "12")));
  const skip = (page - 1) * pageSize;

  const where = {
    role: "ONG" as const,
    accountStatus: AccountStatus.ACTIVE,
    ongProfile: {
      is: {
        verificationStatus: VerificationStatus.APPROVED,
        ...(q
          ? {
              OR: [
                { ongName: { contains: q, mode: "insensitive" as const } },
                { name: { contains: q, mode: "insensitive" as const } },
                { city: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
    },
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        ongProfile: {
          select: {
            ongName: true,
            name: true,
            city: true,
            state: true,
            description: true,
            focusArea: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return apiSuccess({
    ngos: items.map((n) => ({
      id: n.id,
      name: n.ongProfile?.ongName ?? n.ongProfile?.name ?? n.name,
      city: n.ongProfile?.city,
      state: n.ongProfile?.state,
      description: n.ongProfile?.description,
      focusArea: n.ongProfile?.focusArea,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
