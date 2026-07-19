import type { TranslationKey } from "@/lib/i18n/types";
import {
  ACTIVITY_START_FUTURE_MESSAGE,
  ACTIVITY_START_INVALID_MESSAGE,
} from "@/lib/validation/activity-start-date";
import {
  BIRTH_DATE_FUTURE_MESSAGE,
  BIRTH_DATE_TOO_OLD_MESSAGE,
  BIRTH_DATE_TOO_YOUNG_MESSAGE,
} from "@/lib/validation/birth-date";
import {
  BR_DDD_REQUIRED_MESSAGE,
  BR_PHONE_INVALID_MESSAGE,
  BR_PHONE_VALID_MESSAGE,
} from "@/lib/validation/brazil-phone";
import { EMAIL_INVALID_MESSAGE, EMAIL_VALID_MESSAGE } from "@/lib/validation/email";
import { FULL_NAME_INCOMPLETE_MESSAGE } from "@/lib/validation/full-name";
import {
  PHONE_INVALID_MESSAGE,
  PHONE_REQUIRED_MESSAGE,
  PHONE_VALID_MESSAGE,
} from "@/lib/validation/international-phone";
import { USER_ALREADY_REGISTERED_MESSAGE } from "@/lib/registration/document-messages";
import { PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";
import {
  CLIENT_LEGAL_ACCEPTANCE_MESSAGE,
} from "@/lib/legal/legal-links";
import { GENDER_VALIDATION_MESSAGE } from "@/components/features/foundation/register-gender-selector";
import { REGISTER_ROLE_REQUIRED_MESSAGE } from "@/components/features/foundation/register-role-selector";
import { PARTNER_TYPE_REQUIRED_MESSAGE } from "@/lib/partner/constants";
import { ONG_TYPE_REQUIRED_MESSAGE } from "@/lib/ong/constants";
import {
  AUTONOMOUS_DOCS_MISSING_MESSAGE,
  CORPORATE_DOCS_MISSING_MESSAGE,
} from "@/lib/partner/document-validation";
import { ONG_DOCS_MISSING_MESSAGE } from "@/lib/ong/document-validation";
import {
  OPERATION_SCHEDULE_MESSAGE,
} from "@/lib/partner/operation-rules";
import { CPF_NAME_MISMATCH_MESSAGE } from "@/lib/integrations/cpf/cpf-service";
import {
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  FORGOT_PASSWORD_NOT_FOUND_MESSAGE,
  FORGOT_PASSWORD_PHONE_UNAVAILABLE_MESSAGE,
  FORGOT_PASSWORD_SEND_FAILED_MESSAGE,
  VERIFY_CODE_EXPIRED_MESSAGE,
  VERIFY_CODE_INVALID_MESSAGE,
} from "@/lib/constants/auth-messages";
import { USERNAME_INVALID_MESSAGE } from "@/lib/validation/username";

export type AuthTranslator = (key: TranslationKey, params?: Record<string, string>) => string;

/** Mapeia mensagens PT canônicas (libs de validação) → chaves i18n */
const VALIDATION_MESSAGE_KEYS: Record<string, TranslationKey> = {
  [FULL_NAME_INCOMPLETE_MESSAGE]: "auth.validation.fullNameIncomplete",
  [EMAIL_INVALID_MESSAGE]: "auth.validation.emailInvalid",
  [EMAIL_VALID_MESSAGE]: "auth.validation.emailValid",
  [PHONE_INVALID_MESSAGE]: "auth.validation.phoneInvalid",
  [PHONE_VALID_MESSAGE]: "auth.validation.phoneValid",
  [PHONE_REQUIRED_MESSAGE]: "auth.validation.phoneRequired",
  [BR_PHONE_INVALID_MESSAGE]: "auth.validation.brPhoneInvalid",
  [BR_DDD_REQUIRED_MESSAGE]: "auth.validation.brDddRequired",
  [BR_PHONE_VALID_MESSAGE]: "auth.validation.brPhoneValid",
  [BIRTH_DATE_FUTURE_MESSAGE]: "auth.validation.birthDateFuture",
  [BIRTH_DATE_TOO_YOUNG_MESSAGE]: "auth.validation.birthDateTooYoung",
  [BIRTH_DATE_TOO_OLD_MESSAGE]: "auth.validation.birthDateTooOld",
  [PASSWORD_MISMATCH_MESSAGE]: "auth.validation.passwordMismatch",
  [USER_ALREADY_REGISTERED_MESSAGE]: "auth.validation.userAlreadyRegistered",
  [GENDER_VALIDATION_MESSAGE]: "auth.validation.genderRequired",
  [REGISTER_ROLE_REQUIRED_MESSAGE]: "auth.registerFoundation.roleRequired",
  [CLIENT_LEGAL_ACCEPTANCE_MESSAGE]: "auth.terms.acceptanceRequired",
  [ACTIVITY_START_FUTURE_MESSAGE]: "auth.validation.activityStartFuture",
  [ACTIVITY_START_INVALID_MESSAGE]: "auth.validation.activityStartInvalid",
  "Digite um CPF válido.": "auth.validation.cpfInvalid",
  "Digite um CNPJ válido.": "auth.validation.cnpjInvalid",
  "Data de nascimento obrigatória.": "auth.validation.birthDateRequired",
  "Informe seu gênero.": "auth.gender.specify",
  "Nome deve ter no máximo 120 caracteres.": "auth.validation.nameTooLong",
  [USERNAME_INVALID_MESSAGE]: "auth.validation.usernameFormat",
  "Use 4–30 caracteres: letras, números, _ e .": "auth.validation.usernameFormat",
  "Senha não atende aos requisitos de segurança.": "auth.validation.passwordWeak",
  "Você precisa aceitar os termos para continuar.": "auth.terms.acceptanceRequired",
  "Aguarde a verificação do nome de usuário.": "auth.client.usernameCheckingWait",
  [PARTNER_TYPE_REQUIRED_MESSAGE]: "auth.register.partner.validation.partnerTypeRequired",
  [ONG_TYPE_REQUIRED_MESSAGE]: "auth.register.ong.validation.ongTypeRequired",
  [OPERATION_SCHEDULE_MESSAGE]: "auth.register.partner.validation.operationScheduleRequired",
  "Horário de fechamento deve ser posterior ao de abertura.":
    "auth.register.partner.validation.closeTimeAfterOpen",
  [AUTONOMOUS_DOCS_MISSING_MESSAGE]: "auth.register.partner.validation.docsAutonomousMissing",
  [CORPORATE_DOCS_MISSING_MESSAGE]: "auth.register.partner.validation.docsCorporateMissing",
  [ONG_DOCS_MISSING_MESSAGE]: "auth.register.ong.validation.docsPending",
  "Documentos obrigatórios pendentes.": "auth.register.partner.validation.docsPending",
  "Preencha os dados bancários.": "auth.register.partner.validation.bankRequired",
  "Nome de usuário inválido (4–30 caracteres).": "auth.register.partner.validation.usernameInvalid",
  "Nome comercial obrigatório.": "auth.register.partner.validation.businessNameRequired",
  "Razão social obrigatória.": "auth.register.partner.validation.legalNameRequired",
  "Selecione o tipo corporativo.": "auth.register.partner.validation.corporateTypeRequired",
  "Informe o tipo corporativo.": "auth.register.partner.validation.corporateTypeOtherRequired",
  "Selecione ao menos uma área de atuação.": "auth.register.partner.validation.activityAreasRequired",
  "Descreva sua área de atuação.": "auth.register.partner.validation.activityAreasOtherRequired",
  "Descreva melhor sua atuação profissional.": "auth.register.partner.validation.descriptionTooShort",
  "A descrição deve ter no máximo 800 caracteres.": "auth.register.partner.validation.descriptionTooLong",
  "Digite um CEP válido.": "auth.register.partner.validation.zipCodeInvalid",
  "Selecione o tipo de logradouro.": "auth.register.partner.validation.streetTypeRequired",
  "Informe o tipo de logradouro.": "auth.register.partner.validation.streetTypeOtherRequired",
  "Logradouro obrigatório.": "auth.register.partner.validation.streetRequired",
  "Número obrigatório.": "auth.register.partner.validation.numberRequired",
  "Bairro obrigatório.": "auth.register.partner.validation.districtRequired",
  "Cidade obrigatória.": "auth.register.partner.validation.cityRequired",
  "UF obrigatória.": "auth.register.partner.validation.stateRequired",
  "Selecione ao menos uma forma de funcionamento.":
    "auth.register.partner.validation.operationModesRequired",
  "Selecione o raio de atendimento.": "auth.register.partner.validation.serviceRadiusRequired",
  "Selecione ao menos uma forma de pagamento.":
    "auth.register.partner.validation.paymentMethodsRequired",
  "Informe a chave Pix.": "auth.register.partner.validation.pixKeyRequired",
  "Informe o banco.": "auth.register.partner.validation.bankOtherRequired",
  "Senha inválida.": "auth.register.partner.validation.passwordInvalid",
  "Aguarde a verificação do CPF.": "auth.register.partner.validation.waitCpf",
  "Aguarde a verificação do CNPJ.": "auth.register.partner.validation.waitCnpj",
  [CPF_NAME_MISMATCH_MESSAGE]: "auth.validation.cpfNameMismatch",
  "Informe o cargo do representante.": "auth.register.ong.validation.representativeRoleRequired",
  "Informe o cargo.": "auth.register.ong.validation.representativeRoleOtherRequired",
  "Nome da ONG obrigatório.": "auth.register.ong.validation.ongNameRequired",
  "Data de fundação obrigatória.": "auth.register.ong.validation.foundedDateRequired",
  "Selecione a área de atuação.": "auth.register.ong.validation.focusAreaRequired",
  "Informe a área de atuação.": "auth.register.ong.validation.focusAreaOtherRequired",
  "Descreva melhor a instituição.": "auth.register.ong.validation.descriptionInstitution",
  "Descreva melhor sua causa.": "auth.register.ong.validation.descriptionIndividual",
  "Informe a missão da instituição.": "auth.register.ong.validation.missionRequired",
  "Informe a visão da instituição.": "auth.register.ong.validation.visionRequired",
  [FORGOT_PASSWORD_GENERIC_MESSAGE]: "auth.forgotPassword.success",
  // Turnstile (mensagens públicas genéricas → chaves i18n)
  "Verificação necessária. Conclua o desafio para continuar.": "turnstile.required",
  "Não foi possível verificar. Tente novamente.": "turnstile.failed",
  "Verificação expirada. Conclua o desafio novamente.": "turnstile.expired",
  "Serviço temporariamente indisponível. Tente novamente.": "turnstile.unavailable",
  "Serviço de verificação temporariamente indisponível.": "turnstile.unavailable",
  [FORGOT_PASSWORD_SEND_FAILED_MESSAGE]: "auth.forgotPassword.sendFailed",
  [FORGOT_PASSWORD_NOT_FOUND_MESSAGE]: "auth.forgotPassword.notFound",
  [FORGOT_PASSWORD_PHONE_UNAVAILABLE_MESSAGE]: "auth.forgotPassword.phoneUnavailable",
  [VERIFY_CODE_INVALID_MESSAGE]: "auth.forgotPassword.codeInvalid",
  [VERIFY_CODE_EXPIRED_MESSAGE]: "auth.forgotPassword.codeExpired",
};

const PASSWORD_ERROR_KEYS: Record<string, TranslationKey> = {
  length: "auth.validation.passwordMinLength",
  uppercase: "auth.validation.passwordUppercase",
  lowercase: "auth.validation.passwordLowercase",
  number: "auth.validation.passwordNumber",
  special: "auth.validation.passwordSpecial",
  "no-space": "auth.validation.passwordNoSpace",
  "no-email": "auth.validation.passwordNoEmail",
  "no-name": "auth.validation.passwordNoName",
  "no-username": "auth.validation.passwordNoUsername",
  "no-phone": "auth.validation.passwordNoPhone",
  "no-birthdate": "auth.validation.passwordNoBirthdate",
};

const PASSWORD_REQUIREMENT_KEYS: Record<string, TranslationKey> = {
  length: "auth.password.requirements.length",
  uppercase: "auth.password.requirements.uppercase",
  lowercase: "auth.password.requirements.lowercase",
  number: "auth.password.requirements.number",
  special: "auth.password.requirements.special",
  "no-space": "auth.password.requirements.noSpace",
  "no-email": "auth.password.requirements.noEmail",
  "no-name": "auth.password.requirements.noName",
  "no-username": "auth.password.requirements.noUsername",
  "no-phone": "auth.password.requirements.noPhone",
  "no-birthdate": "auth.password.requirements.noBirthdate",
  len12: "auth.password.requirements.length12",
  "no-common": "auth.password.requirements.noCommon",
};

const PASSWORD_LEVEL_KEYS: Record<string, TranslationKey> = {
  very_weak: "auth.password.level.veryWeak",
  weak: "auth.password.level.weak",
  medium: "auth.password.level.medium",
  strong: "auth.password.level.strong",
  excellent: "auth.password.level.excellent",
};

const API_ERROR_CODE_KEYS: Record<string, TranslationKey> = {
  USER_NOT_FOUND: "auth.login.errors.userNotFound",
  USER_OR_PASSWORD_INCORRECT: "auth.login.errors.wrongPassword",
  ACCOUNT_UNAVAILABLE: "auth.login.errors.accountUnavailable",
  ACCOUNT_LOCKED: "auth.login.errors.accountSuspended",
  EMAIL_NOT_VERIFIED: "auth.login.errors.accountUnavailable",
  DUPLICATE_REGISTRATION: "auth.validation.userAlreadyRegistered",
  USER_ALREADY_EXISTS: "auth.validation.userAlreadyRegistered",
};

export function translateAuthMessage(message: string | undefined, t: AuthTranslator): string {
  if (!message) return "";
  const key = VALIDATION_MESSAGE_KEYS[message];
  if (key) return t(key);
  return message;
}

export function translatePasswordError(requirementId: string | undefined, t: AuthTranslator): string {
  if (!requirementId) return t("auth.validation.passwordWeak");
  const key = PASSWORD_ERROR_KEYS[requirementId];
  return key ? t(key) : t("auth.validation.passwordWeak");
}

export function translatePasswordRequirement(requirementId: string, t: AuthTranslator): string {
  const key = PASSWORD_REQUIREMENT_KEYS[requirementId];
  return key ? t(key) : requirementId;
}

export function translatePasswordLevel(
  level: keyof typeof PASSWORD_LEVEL_KEYS,
  t: AuthTranslator
): string {
  const key = PASSWORD_LEVEL_KEYS[level];
  return key ? t(key) : level;
}

export function translateApiAuthError(
  message: string,
  code: string | undefined,
  t: AuthTranslator
): string {
  if (code && API_ERROR_CODE_KEYS[code]) {
    return t(API_ERROR_CODE_KEYS[code]);
  }
  const mapped = translateAuthMessage(message, t);
  if (mapped !== message) return mapped;
  if (code === "VALIDATION" && message) return translateAuthMessage(message, t) || message;
  return translateAuthMessage(message, t) || t("common.error");
}
