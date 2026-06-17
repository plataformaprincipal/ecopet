export type RegistrationRole =
  | "TUTOR"
  | "VETERINARIAN"
  | "CLINIC"
  | "PETSHOP"
  | "SELLER"
  | "SERVICE_PROVIDER"
  | "ONG";

export const REGISTRATION_ROLES: { value: RegistrationRole; label: string; description: string }[] = [
  { value: "TUTOR", label: "Cliente / Tutor", description: "Dono de pet — produtos, saúde e comunidade" },
  { value: "VETERINARIAN", label: "Veterinário", description: "Profissional com CRMV" },
  { value: "CLINIC", label: "Clínica Veterinária", description: "Estabelecimento com equipe e serviços" },
  { value: "PETSHOP", label: "Pet Shop", description: "Loja física com produtos e/ou serviços" },
  { value: "SELLER", label: "Parceiro / Loja", description: "Vendedor no marketplace ECOPET" },
  { value: "SERVICE_PROVIDER", label: "Prestador de Serviço", description: "Banho, passeio, adestramento e mais" },
  { value: "ONG", label: "ONG / Protetor", description: "Adoção, resgate e campanhas" },
];

export const ROLE_REDIRECTS: Record<RegistrationRole, string> = {
  TUTOR: "/onboarding/pet",
  VETERINARIAN: "/dashboard/veterinario",
  CLINIC: "/dashboard/clinica",
  PETSHOP: "/dashboard/petshop",
  SELLER: "/dashboard/seller",
  SERVICE_PROVIDER: "/dashboard/prestador",
  ONG: "/dashboard/ong",
};

export const PENDING_APPROVAL_ROLES: RegistrationRole[] = [
  "VETERINARIAN",
  "CLINIC",
  "PETSHOP",
  "SELLER",
  "SERVICE_PROVIDER",
];

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const TUTOR_INTERESTS = [
  { value: "produtos", label: "Produtos" },
  { value: "servicos", label: "Serviços" },
  { value: "saude", label: "Saúde" },
  { value: "adocao", label: "Adoção" },
  { value: "rede_social", label: "Rede social" },
];

export const SERVICE_TYPES = [
  { value: "banho_tosa", label: "Banho e tosa" },
  { value: "dog_walker", label: "Dog walker" },
  { value: "pet_sitter", label: "Pet sitter" },
  { value: "adestrador", label: "Adestrador" },
  { value: "transporte", label: "Transporte pet" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "creche", label: "Creche pet" },
  { value: "cuidador", label: "Cuidador" },
  { value: "outro", label: "Outro" },
];

export const ONG_ACTION_TYPES = [
  { value: "adocao", label: "Adoção" },
  { value: "resgate", label: "Resgate" },
  { value: "lar_temporario", label: "Lar temporário" },
  { value: "campanhas", label: "Campanhas" },
  { value: "doacoes", label: "Doações" },
];

export const PETSHOP_CATEGORIES = [
  "Ração", "Acessórios", "Higiene", "Medicamentos", "Brinquedos", "Aquarismo", "Outros",
];

export const ADMIN_ACCESS_LEVELS = [
  { value: "suporte", label: "Suporte" },
  { value: "financeiro", label: "Financeiro" },
  { value: "comercial", label: "Comercial" },
  { value: "moderacao", label: "Moderação" },
  { value: "administrador_geral", label: "Administrador geral" },
];

export type FormValues = Record<string, unknown>;

export function getDefaultFormValues(role: RegistrationRole): FormValues {
  const base: FormValues = {
    role,
    name: "",
    tradeName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptLgpd: false,
    documents: [] as { name: string; size?: number; type?: string }[],
    address: {
      street: "",
      number: "",
      district: "",
      city: "",
      state: "SP",
      zipCode: "",
      complement: "",
      reference: "",
      latitude: null,
      longitude: null,
    },
    bankData: { pixKey: "", bankName: "", accountHolder: "" },
  };

  switch (role) {
    case "TUTOR":
      return {
        ...base,
        cpf: "",
        birthDate: "",
        petCount: 0,
        primaryInterests: [] as string[],
      };
    case "VETERINARIAN":
      return {
        ...base,
        cpf: "",
        crmv: "",
        crmvState: "SP",
        specialty: "",
        professionalAddress: "",
        inPersonAvailable: true,
        onlineAvailable: false,
        averageConsultationPrice: "",
      };
    case "CLINIC":
      return {
        ...base,
        cnpj: "",
        technicalResponsible: "",
        responsibleCrmv: "",
        hours: "",
        services: [] as string[],
        emergency: false,
      };
    case "PETSHOP":
      return {
        ...base,
        cnpj: "",
        responsible: "",
        sellsProducts: true,
        offersServices: false,
        categories: [] as string[],
        hours: "",
      };
    case "SELLER":
      return {
        ...base,
        cnpj: "",
        responsible: "",
        productCategories: [] as string[],
        deliveryPolicy: "",
        exchangePolicy: "",
      };
    case "SERVICE_PROVIDER":
      return {
        ...base,
        documentType: "CPF",
        documentNumber: "",
        serviceTypes: [] as string[],
        serviceArea: "",
        homeService: false,
        startingPrice: "",
        availability: "",
      };
    case "ONG":
      return {
        ...base,
        documentType: "CNPJ",
        documentNumber: "",
        tradeName: "",
        responsible: "",
        actionTypes: [] as string[],
        animalCapacity: 0,
        acceptsDonations: true,
      };
    default:
      return base;
  }
}
