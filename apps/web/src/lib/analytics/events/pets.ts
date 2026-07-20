import { defineEvent } from "./definitions";

export const PetEvents = {
  PET_ADD: defineEvent({
    event_name: "pet_add",
    category: "pets",
    action: "create",
    module: "pets",
  }),
  PET_EDIT: defineEvent({
    event_name: "pet_edit",
    category: "pets",
    action: "edit",
    module: "pets",
  }),
  PET_DELETE: defineEvent({
    event_name: "pet_delete",
    category: "pets",
    action: "delete",
    module: "pets",
  }),
  VACCINE_ADD: defineEvent({
    event_name: "pet_vaccine_add",
    category: "pets",
    action: "vaccine_add",
    module: "pets",
  }),
  VACCINE_EDIT: defineEvent({
    event_name: "pet_vaccine_edit",
    category: "pets",
    action: "vaccine_edit",
    module: "pets",
  }),
  DOCUMENT_ADD: defineEvent({
    event_name: "pet_document_add",
    category: "pets",
    action: "document_add",
    module: "pets",
  }),
  WEIGHT_UPDATE: defineEvent({
    event_name: "pet_weight_update",
    category: "pets",
    action: "weight",
    module: "pets",
  }),
  BREED_SET: defineEvent({
    event_name: "pet_breed_set",
    category: "pets",
    action: "breed",
    module: "pets",
  }),
  SPECIES_SET: defineEvent({
    event_name: "pet_species_set",
    category: "pets",
    action: "species",
    module: "pets",
  }),
} as const;
