import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateOngOnboarding,
  isOngFeeExemptCategory,
  ONG_ADS_CREDITS_PER_YEAR,
  ONG_MONTHLY_FEE_BRL,
} from "./onboarding";

describe("ong onboarding", () => {
  it("ONG aprovada com MP pode receber; mensalidade e taxa de adoção/doação são zero", () => {
    const snap = evaluateOngOnboarding({
      accountStatus: "ACTIVE",
      verificationStatus: "APPROVED",
      approvedAt: new Date("2026-01-01"),
      ongName: "Ampara Pets",
      address: "Rua B",
      city: "Recife",
      description: "Resgate",
      focusArea: "ADOPTION",
      documents: [{ type: "CNPJ_CARD" }],
      financialDetails: { pixKey: "ong@ampara.org", pixKeyType: "E-mail" },
      mpStatus: "CONNECTED",
      mpUserId: "999",
      profileDetails: { adsCredits: { used: 3, granted: 20 } },
    });
    assert.equal(snap.sellable, true);
    assert.equal(snap.monthlyFeeBrl, ONG_MONTHLY_FEE_BRL);
    assert.equal(snap.adsCreditsPerYear, ONG_ADS_CREDITS_PER_YEAR);
    assert.equal(snap.adsCreditsRemaining, 17);
    assert.equal(isOngFeeExemptCategory("ADOPTION"), true);
    assert.equal(isOngFeeExemptCategory("DONATION"), true);
    assert.equal(isOngFeeExemptCategory("PETSHOP"), false);
  });
});
