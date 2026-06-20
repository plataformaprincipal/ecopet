/** Campos obrigatórios extras no cadastro CLIENT (username + gênero + aceites). */
export function clientRegisterExtras(suffix) {
  const s = String(suffix).replace(/\D/g, "").slice(-10) || "1";
  return {
    username: `user${s}`,
    gender: "MASCULINO",
    acceptTerms: true,
    acceptPrivacy: true,
  };
}

/** Celular BR válido em E.164 para cadastro CLIENT. */
export function clientMobilePhone(suffix) {
  return `+55119${String(suffix).replace(/\D/g, "").padStart(8, "0").slice(-8)}`;
}

/** Telefones internacionais válidos para testes. */
export const TEST_PHONES = {
  BR: "+5583999382221",
  US: "+12025550100",
  PT: "+351912345678",
  GB: "+447911123456",
};
