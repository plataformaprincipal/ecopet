import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";

const CONTACT_VISIBLE_STATUSES = new Set(["UNDER_REVIEW", "APPROVED", "COMPLETED"]);

/** Solicitações de adoção recebidas pela ONG autenticada (apenas as próprias). */
export async function GET() {
  const { user, error } = await requireOngWithAccess();
  if (error) return error;

  const requests = await prisma.adoptionRequest.findMany({
    where: { ongId: user!.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      listing: { select: { id: true, name: true, species: true, photos: true } },
      requester: { select: { id: true, name: true, email: true } },
    },
  });

  return apiSuccess({
    requests: requests.map((r) => {
      const photos = Array.isArray(r.listing?.photos)
        ? (r.listing.photos as string[])
        : [];
      const contactAuthorized = CONTACT_VISIBLE_STATUSES.has(r.status);
      return {
        id: r.id,
        status: r.status,
        message: r.message,
        history: Array.isArray(r.history) ? r.history : [],
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        animal: r.listing
          ? { id: r.listing.id, name: r.listing.name, species: r.listing.species, photo: photos[0] ?? null }
          : null,
        requester: {
          id: r.requester.id,
          name: r.requester.name,
          email: contactAuthorized ? r.requester.email : null,
        },
        contactAuthorized,
      };
    }),
  });
}
