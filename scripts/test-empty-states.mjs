/**
 * EcoPet — test:empty-states
 * Valida que módulos de dados retornam vazio (sem conteúdo fictício).
 */
import { getQuotesForClient } from "../apps/web/src/lib/ecosystem/quotes-api.ts";
import { CLIENT_PETS, CLIENT_SOCIAL_FEED } from "../apps/web/src/lib/profile/defaults/client.ts";
import { NGO_CAMPAIGNS } from "../apps/web/src/lib/profile/defaults/ngo.ts";
import { PARTNER_PRODUCTS, PARTNER_SERVICES } from "../apps/web/src/lib/profile/defaults/partner.ts";
import {
  EXTERNAL_INTEGRATIONS,
  getRobotsForProfile,
} from "../apps/web/src/lib/integrations/empty.ts";

let passed = 0;
let failed = 0;

function ok(label, cond) {
  if (cond) {
    console.log(`✓ ${label}`);
    passed++;
  } else {
    console.error(`✗ ${label}`);
    failed++;
  }
}

console.log("=== EcoPet — test:empty-states ===\n");

ok("getQuotesForClient → []", getQuotesForClient().length === 0);
ok("CLIENT_PETS vazio", CLIENT_PETS.length === 0);
ok("CLIENT_SOCIAL_FEED vazio", CLIENT_SOCIAL_FEED.length === 0);
ok("NGO_CAMPAIGNS vazio", NGO_CAMPAIGNS.length === 0);
ok("PARTNER_PRODUCTS vazio", PARTNER_PRODUCTS.length === 0);
ok("PARTNER_SERVICES vazio", PARTNER_SERVICES.length === 0);
ok("integrações externas vazio", EXTERNAL_INTEGRATIONS.length === 0);
ok("robôs vazio", getRobotsForProfile("CLIENT").length === 0);

console.log(`\n${passed} passaram, ${failed} falharam`);
process.exit(failed > 0 ? 1 : 0);
