export type CnpjSecondaryCnae = {
  code: string;
  description: string;
};

export type CnpjLookupAddress = {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string;
};

export type CnpjLookupResult = {
  cnpj: string;
  legalName: string;
  businessName: string;
  registrationStatus: string;
  registrationStatusCode: number;
  openingDate: string | null;
  address: CnpjLookupAddress;
  mainCnae: CnpjSecondaryCnae;
  secondaryCnaes: CnpjSecondaryCnae[];
  legalNature: string;
  provider: "brasilapi";
  warnings: string[];
};

export const CNPJ_BAIXADO_MESSAGE = "Este CNPJ encontra-se baixado.";
export const CNPJ_INAPTO_MESSAGE = "Este CNPJ apresenta restrições cadastrais.";
