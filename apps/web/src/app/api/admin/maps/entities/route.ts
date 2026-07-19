import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { approximateCoordinates } from "@/lib/google-maps/validation";

export const dynamic = "force-dynamic";

/** Entidades com coordenadas para mapas admin — sem endereço residencial de clientes. */
export async function GET(req: Request) {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  if (!checkRateLimit(`admin-maps-entities:${user!.id}`, 30, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite excedido.", 429);
  }

  const type = new URL(req.url).searchParams.get("type") || "partner";

  if (type === "ong") {
    const ongs = await prisma.ongProfile.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        publicLocationEnabled: true,
      },
      take: 200,
      select: {
        id: true,
        name: true,
        ongName: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        locationApproximate: true,
        verificationStatus: true,
      },
    });
    return apiSuccess({
      entities: ongs.map((o) => {
        const coords =
          o.locationApproximate && o.latitude != null && o.longitude != null
            ? approximateCoordinates(o.latitude, o.longitude)
            : { lat: o.latitude!, lng: o.longitude! };
        return {
          id: o.id,
          name: o.ongName || o.name,
          city: o.city,
          state: o.state,
          lat: coords.lat,
          lng: coords.lng,
          status: o.verificationStatus,
          approximate: o.locationApproximate,
        };
      }),
    });
  }

  const partners = await prisma.partnerProfile.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    take: 200,
    select: {
      id: true,
      businessName: true,
      city: true,
      state: true,
      category: true,
      latitude: true,
      longitude: true,
      verificationStatus: true,
    },
  });

  return apiSuccess({
    entities: partners.map((p) => ({
      id: p.id,
      name: p.businessName,
      city: p.city,
      state: p.state,
      category: p.category,
      lat: p.latitude!,
      lng: p.longitude!,
      status: p.verificationStatus,
      approximate: false,
    })),
  });
}
