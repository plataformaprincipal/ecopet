import { Router } from "express";
import { prisma } from "@ecopet/database";

const META_PREFIX = "---ECOPET_META---";
const META_SUFFIX = "---END---";

function isListingUnavailable(requirements: string | null): boolean {
  if (!requirements?.startsWith(META_PREFIX)) return false;
  const end = requirements.indexOf(META_SUFFIX, META_PREFIX.length);
  if (end === -1) return false;
  try {
    const meta = JSON.parse(requirements.slice(META_PREFIX.length, end)) as { unavailable?: boolean };
    return Boolean(meta.unavailable);
  } catch {
    return false;
  }
}

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const listings = await prisma.adoptionListing.findMany({
      where: {
        status: "AVAILABLE",
        ong: {
          accountStatus: "ACTIVE",
          ongProfile: { verificationStatus: "APPROVED" },
        },
      },
      include: { ong: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });

    const visible = listings.filter((listing) => !isListingUnavailable(listing.requirements));

    res.json(visible);
  } catch (e) {
    next(e);
  }
});

export default router;
