import type { OngType } from "@/lib/ong/constants";

export type OngSocialLinks = {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  whatsapp?: string;
  website?: string;
};

export type OngFormState = {
  ongType: OngType | null;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  username: string;
  activityStartDate: string;
  representativeRole: string;
  representativeRoleOther: string;
  cnpj: string;
  ongName: string;
  legalName: string;
  tradeName: string;
  foundedDate: string;
  focusArea: string;
  focusAreaOther: string;
  actionTypes: string[];
  actionTypesOther: string;
  description: string;
  mission: string;
  vision: string;
  animalCapacity: string;
  city: string;
  state: string;
  address: string;
  pixKey: string;
  socialLinks: OngSocialLinks;
  password: string;
  confirmPassword: string;
};

export const INITIAL_ONG_FORM: OngFormState = {
  ongType: null,
  name: "",
  cpf: "",
  email: "",
  phone: "",
  username: "",
  activityStartDate: "",
  representativeRole: "",
  representativeRoleOther: "",
  cnpj: "",
  ongName: "",
  legalName: "",
  tradeName: "",
  foundedDate: "",
  focusArea: "",
  focusAreaOther: "",
  actionTypes: [],
  actionTypesOther: "",
  description: "",
  mission: "",
  vision: "",
  animalCapacity: "",
  city: "",
  state: "",
  address: "",
  pixKey: "",
  socialLinks: {},
  password: "",
  confirmPassword: "",
};

export const ONG_DRAFT_KEY = "ecopet-ong-register-draft";

export function formToOngRegisterPayload(
  form: OngFormState,
  phoneE164: string,
  extras?: {
    providedDocumentTypes?: string[];
    verificationDocuments?: unknown[];
    profileImageUrl?: string;
    coverImageUrl?: string;
    logoUrl?: string;
  }
) {
  const profileDetails = {
    mission: form.mission.trim() || undefined,
    vision: form.vision.trim() || undefined,
    pixKey: form.pixKey.trim() || undefined,
    representativeRole:
      form.representativeRole === "Outro"
        ? form.representativeRoleOther.trim() || undefined
        : form.representativeRole || undefined,
    activityStartDate: form.activityStartDate || undefined,
    foundedDate: form.foundedDate || undefined,
    socialLinks: form.socialLinks,
    profileImageUrl: extras?.profileImageUrl,
    coverImageUrl: extras?.coverImageUrl,
    logoUrl: extras?.logoUrl,
  };

  const base = {
    role: "ONG" as const,
    ongType: form.ongType!,
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: phoneE164,
    username: form.username.toLowerCase(),
    actionTypes: form.actionTypes,
    actionTypesOther: form.actionTypesOther.trim() || undefined,
    description: form.description.trim(),
    animalCapacity: form.animalCapacity ? Number(form.animalCapacity) : undefined,
    city: form.city.trim(),
    state: form.state.toUpperCase(),
    address: form.address.trim() || undefined,
    profileDetails,
    password: form.password,
    confirmPassword: form.confirmPassword,
    acceptTerms: true as const,
    acceptPrivacy: true as const,
    providedDocumentTypes: extras?.providedDocumentTypes,
    verificationDocuments: extras?.verificationDocuments,
  };

  if (form.ongType === "INDIVIDUAL") {
    return {
      ...base,
      cpf: form.cpf.replace(/\D/g, ""),
      activityStartDate: form.activityStartDate,
    };
  }

  return {
    ...base,
    cpf: form.cpf.replace(/\D/g, ""),
    cnpj: form.cnpj.replace(/\D/g, ""),
    ongName: form.ongName.trim(),
    legalName: form.legalName.trim(),
    tradeName: form.tradeName.trim() || undefined,
    foundedDate: form.foundedDate,
    focusArea:
      form.focusArea === "Outro" && form.focusAreaOther.trim()
        ? `Outro: ${form.focusAreaOther.trim()}`
        : form.focusArea,
    representativeRole: profileDetails.representativeRole,
  };
}
