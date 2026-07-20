import { defineEvent } from "./definitions";

export const NgoEvents = {
  SIGNUP: defineEvent({
    event_name: "ngo_signup",
    category: "ngo",
    action: "signup",
    module: "ngo",
  }),
  APPROVED: defineEvent({
    event_name: "ngo_approved",
    category: "ngo",
    action: "approved",
    module: "ngo",
  }),
  ANIMAL_ADD: defineEvent({
    event_name: "ngo_animal_add",
    category: "ngo",
    action: "animal_add",
    module: "ngo",
  }),
  ANIMAL_ADOPTED: defineEvent({
    event_name: "ngo_animal_adopted",
    category: "ngo",
    action: "adopted",
    module: "ngo",
  }),
  CAMPAIGN: defineEvent({
    event_name: "ngo_campaign",
    category: "ngo",
    action: "campaign",
    module: "ngo",
  }),
  DONATION: defineEvent({
    event_name: "ngo_donation",
    category: "ngo",
    action: "donation",
    module: "ngo",
  }),
} as const;
