import { EMPTY_ADDRESS } from "@/lib/address/types";
import type { PartnerType } from "@/lib/partner/constants";
import type { CnpjLookupResult } from "@/lib/integrations/cnpj/types";

export type PartnerVerificationDocumentMeta = {
  id: string;
  type: string;
  typeLabel: string;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type PartnerAddressForm = {
  zipCode: string;
  streetType: string;
  streetTypeOther: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string;
  reference?: string;
};

export type PartnerFormState = {
  partnerType: PartnerType | null;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  username: string;
  activityStartDate: string;
  professionalName: string;
  cnpj: string;
  businessName: string;
  legalName: string;
  corporateType: string;
  corporateTypeOther: string;
  activityAreas: string[];
  activityAreasOther: string;
  businessDescription: string;
  addressDetails: PartnerAddressForm;
  operationModes: string[];
  weekdays: string[];
  openTime: string;
  closeTime: string;
  serviceRadius: string;
  deliveryOptions: string[];
  logisticsNotes: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  googleBusiness: string;
  whatsapp: string;
  website: string;
  paymentMethods: string[];
  pixKeyType: string;
  pixKey: string;
  bankName: string;
  bankNameOther: string;
  agency: string;
  accountNumber: string;
  accountDigit: string;
  accountType: string;
  accountHolder: string;
  accountHolderDocument: string;
  logoAlt: string;
  cnpjDetails: CnpjLookupResult | null;
  password: string;
  confirmPassword: string;
};

export const INITIAL_PARTNER_FORM: PartnerFormState = {
  partnerType: null,
  name: "",
  cpf: "",
  email: "",
  phone: "",
  username: "",
  activityStartDate: "",
  professionalName: "",
  cnpj: "",
  businessName: "",
  legalName: "",
  corporateType: "",
  corporateTypeOther: "",
  activityAreas: [],
  activityAreasOther: "",
  businessDescription: "",
  addressDetails: {
    ...EMPTY_ADDRESS,
    streetType: "Rua",
    streetTypeOther: "",
  },
  operationModes: [],
  weekdays: [],
  openTime: "",
  closeTime: "",
  serviceRadius: "",
  deliveryOptions: [],
  logisticsNotes: "",
  instagram: "",
  linkedin: "",
  facebook: "",
  twitter: "",
  googleBusiness: "",
  whatsapp: "",
  website: "",
  paymentMethods: [],
  pixKeyType: "",
  pixKey: "",
  bankName: "",
  bankNameOther: "",
  agency: "",
  accountNumber: "",
  accountDigit: "",
  accountType: "Corrente",
  accountHolder: "",
  accountHolderDocument: "",
  logoAlt: "",
  cnpjDetails: null,
  password: "",
  confirmPassword: "",
};

export const PARTNER_DRAFT_KEY = "ecopet-partner-register-draft";

export function formToRegisterPayload(
  form: PartnerFormState,
  phoneE164: string,
  extras?: {
    logoUrl?: string;
    verificationDocuments?: PartnerVerificationDocumentMeta[];
    providedDocumentTypes?: string[];
  }
) {
  const base = {
    role: "PARTNER" as const,
    partnerType: form.partnerType!,
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: phoneE164,
    username: form.username.toLowerCase(),
    activityStartDate: form.activityStartDate,
    activityAreas: form.activityAreas,
    activityAreasOther: form.activityAreasOther || undefined,
    businessDescription: form.businessDescription.trim(),
    password: form.password,
    confirmPassword: form.confirmPassword,
    acceptTerms: true as const,
    acceptPrivacy: true as const,
    logoUrl: extras?.logoUrl,
    logoAlt: form.logoAlt.trim() || undefined,
    verificationDocuments: extras?.verificationDocuments,
    providedDocumentTypes: extras?.providedDocumentTypes,
    cnpjDetails: form.cnpjDetails ?? undefined,
    addressDetails: {
      zipCode: form.addressDetails.zipCode,
      streetType: form.addressDetails.streetType,
      streetTypeOther: form.addressDetails.streetTypeOther || undefined,
      street: form.addressDetails.street,
      number: form.addressDetails.number,
      district: form.addressDetails.district,
      city: form.addressDetails.city,
      state: form.addressDetails.state.toUpperCase(),
      complement: form.addressDetails.complement,
      reference: form.addressDetails.reference,
    },
    operationDetails: {
      modes: form.operationModes,
      weekdays: form.weekdays,
      openTime: form.openTime || undefined,
      closeTime: form.closeTime || undefined,
      serviceRadius: form.serviceRadius,
      deliveryOptions: form.deliveryOptions,
      logisticsNotes: form.logisticsNotes || undefined,
      socialLinks: {
        instagram: form.instagram || undefined,
        linkedin: form.linkedin || undefined,
        facebook: form.facebook || undefined,
        twitter: form.twitter || undefined,
        googleBusiness: form.googleBusiness || undefined,
        whatsapp: form.whatsapp || undefined,
        website: form.website || undefined,
      },
    },
    financialDetails: {
      paymentMethods: form.paymentMethods,
      pixKeyType: form.pixKeyType || undefined,
      pixKey: form.pixKey || undefined,
      bankName: form.bankName || undefined,
      bankNameOther: form.bankNameOther || undefined,
      agency: form.agency || undefined,
      accountNumber: form.accountNumber || undefined,
      accountDigit: form.accountDigit || undefined,
      accountType: form.accountType || undefined,
      accountHolder: form.accountHolder || undefined,
      accountHolderDocument: form.accountHolderDocument || undefined,
    },
  };

  if (form.partnerType === "AUTONOMOUS") {
    return {
      ...base,
      cpf: form.cpf.replace(/\D/g, ""),
      professionalName: form.professionalName.trim(),
    };
  }

  return {
    ...base,
    cnpj: form.cnpj.replace(/\D/g, ""),
    businessName: form.businessName.trim(),
    legalName: form.legalName.trim(),
    corporateType: form.corporateType,
    corporateTypeOther: form.corporateTypeOther || undefined,
  };
}
