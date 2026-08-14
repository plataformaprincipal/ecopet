import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { serializeOngListing } from "@/lib/ong/serialize-listing";
import { unpackRequirements } from "@/lib/ong/adoption-listing-meta";

function parseBool(v: string | null): boolean | undefined {
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
}

function ageBucket(age: string | null | undefined): string | null {
  if (!age) return null;
  const n = Number.parseInt(age.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) {
    const lower = age.toLowerCase();
    if (lower.includes("filhote") || lower.includes("puppy") || lower.includes("kitten")) return "puppy";
    if (lower.includes("jovem") || lower.includes("young")) return "young";
    if (lower.includes("idoso") || lower.includes("senior")) return "senior";
    if (lower.includes("adulto") || lower.includes("adult")) return "adult";
    return null;
  }
  if (n <= 1) return "puppy";
  if (n <= 3) return "young";
  if (n <= 8) return "adult";
  return "senior";
}

/** Animais disponíveis publicamente para adoção (somente ONGs aprovadas). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const species = url.searchParams.get("species")?.trim();
  const q = url.searchParams.get("q")?.trim();
  const sex = url.searchParams.get("sex")?.trim()?.toLowerCase();
  const size = url.searchParams.get("size")?.trim()?.toLowerCase();
  const city = url.searchParams.get("city")?.trim()?.toLowerCase();
  const state = url.searchParams.get("state")?.trim()?.toLowerCase();
  const age = url.searchParams.get("age")?.trim()?.toLowerCase();
  const vaccinated = parseBool(url.searchParams.get("vaccinated"));
  const neutered = parseBool(url.searchParams.get("neutered"));
  const specialNeeds = parseBool(url.searchParams.get("specialNeeds"));
  const childFriendly = parseBool(url.searchParams.get("childFriendly"));
  const animalFriendly = parseBool(url.searchParams.get("animalFriendly"));
  const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
  const pageSize = Math.min(60, Math.max(1, Number(url.searchParams.get("pageSize") || 24) || 24));

  const listings = await prisma.adoptionListing.findMany({
    where: {
      status: "AVAILABLE",
      ...(species ? { species: species as never } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ong: {
        accountStatus: "ACTIVE",
        ongProfile: {
          is: {
            verificationStatus: "APPROVED",
            ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
            ...(state ? { state: { equals: state, mode: "insensitive" as const } } : {}),
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      ong: {
        select: {
          id: true,
          name: true,
          ongProfile: { select: { ongName: true, name: true, city: true, state: true } },
        },
      },
    },
  });

  const filtered = listings.filter((l) => {
    const { meta } = unpackRequirements(l.requirements);
    if (meta.unavailable) return false;
    if (sex) {
      const metaSex = (meta.sex || "").toLowerCase();
      if (sex === "unknown") {
        if (metaSex) return false;
      } else if (metaSex !== sex) {
        return false;
      }
    }
    if (size && (meta.size || "").toLowerCase() !== size) return false;
    if (vaccinated !== undefined && Boolean(meta.vaccinated) !== vaccinated) return false;
    if (neutered !== undefined && Boolean(meta.neutered) !== neutered) return false;
    if (specialNeeds === true) {
      const hasNeeds = Boolean(meta.healthCondition || meta.medications || meta.behavior);
      if (!hasNeeds) return false;
    }
    if (childFriendly !== undefined && meta.childFriendly !== undefined && meta.childFriendly !== childFriendly) {
      return false;
    }
    if (animalFriendly !== undefined && meta.animalFriendly !== undefined && meta.animalFriendly !== animalFriendly) {
      return false;
    }
    if (age) {
      const bucket = ageBucket(l.age);
      if (bucket && bucket !== age) return false;
      if (!bucket) return false;
    }
    if (city) {
      const listingCity = (meta.city || l.ong.ongProfile?.city || "").toLowerCase();
      if (!listingCity.includes(city)) return false;
    }
    if (state) {
      const listingState = (meta.state || l.ong.ongProfile?.state || "").toLowerCase();
      if (listingState !== state) return false;
    }
    return true;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const animals = pageItems.map((l) => ({
    ...serializeOngListing(l),
    ong: {
      id: l.ong.id,
      name: l.ong.ongProfile?.ongName ?? l.ong.ongProfile?.name ?? l.ong.name,
      city: l.ong.ongProfile?.city ?? null,
      state: l.ong.ongProfile?.state ?? null,
    },
  }));

  return apiSuccess({
    animals,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
