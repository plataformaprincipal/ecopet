import { prisma } from "@/lib/prisma";
import { getOngAccessLevel } from "@/lib/ong/access";
import { requireOng } from "@/lib/auth/require-auth";
import { apiFailure } from "@/lib/api-response";

export async function requireOngWithAccess(requireFull = false) {
  const { user, error } = await requireOng();
  if (error) return { user: null, accessLevel: null as never, error };

  const ongProfile = await prisma.ongProfile.findUnique({
    where: { userId: user!.id },
    select: { verificationStatus: true },
  });

  const accessLevel = getOngAccessLevel({
    accountStatus: user!.accountStatus,
    verificationStatus: ongProfile?.verificationStatus,
  });

  if (requireFull && accessLevel !== "full") {
    return {
      user: null,
      accessLevel,
      error: apiFailure(
        "ONG_NOT_APPROVED",
        "Recurso disponível após aprovação da ONG.",
        403
      ),
    };
  }

  return { user, accessLevel, error: null };
}
