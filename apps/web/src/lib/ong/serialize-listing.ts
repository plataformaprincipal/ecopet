import type { AdoptionListing } from "@prisma/client";
import {
  getOngAnimalDisplayStatus,
  unpackRequirements,
} from "@/lib/ong/adoption-listing-meta";

export type SerializedOngListing = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  photos: string[];
  description: string;
  requirementsText: string;
  size: string | null;
  sex: string | null;
  healthCondition: string | null;
  vaccinated: boolean;
  neutered: boolean;
  city: string | null;
  state: string | null;
  status: string;
  displayStatus: string;
  createdAt: string;
};

export function serializeOngListing(listing: AdoptionListing): SerializedOngListing {
  const { meta, text } = unpackRequirements(listing.requirements);
  const photos = Array.isArray(listing.photos)
    ? (listing.photos as string[])
    : listing.photos
      ? [String(listing.photos)]
      : [];

  return {
    id: listing.id,
    name: listing.name,
    species: listing.species,
    breed: listing.breed,
    age: listing.age,
    photos,
    description: listing.description,
    requirementsText: text,
    size: meta.size ?? null,
    sex: meta.sex ?? null,
    healthCondition: meta.healthCondition ?? null,
    vaccinated: meta.vaccinated ?? false,
    neutered: meta.neutered ?? false,
    city: meta.city ?? null,
    state: meta.state ?? null,
    status: listing.status,
    displayStatus: getOngAnimalDisplayStatus(listing.status, meta),
    createdAt: listing.createdAt.toISOString(),
  };
}
