import type { FormValues, RegistrationRole } from "./personas";
import { analyzePassword } from "@/lib/password/strength";
import {
  validateBirthDate,
  validateCpfField,
  validateCnpjField,
  USER_MESSAGES,
} from "@/lib/validation/documents";
import { onlyDigits } from "@/lib/validation/documents-shared";

function requireString(values: FormValues, key: string, label: string, errors: Record<string, string>) {
  if (!String(values[key] ?? "").trim()) errors[key] = `${label} é obrigatório`;
}

function requireArray(values: FormValues, key: string, label: string, errors: Record<string, string>) {
  const arr = values[key];
  if (!Array.isArray(arr) || arr.length === 0) errors[key] = `${label}: selecione ao menos uma opção`;
}

export function validateRegistration(role: RegistrationRole, values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  requireString(values, "email", "E-mail", errors);
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email))) {
    errors.email = "E-mail inválido";
  }

  requireString(values, "phone", "Telefone/WhatsApp", errors);
  const phoneDigits = onlyDigits(String(values.phone ?? ""));
  if (values.phone && (phoneDigits.length < 10 || phoneDigits.length > 11)) {
    errors.phone = "Telefone inválido";
  }

  requireString(values, "password", "Senha", errors);
  if (values.password) {
    const analysis = analyzePassword(String(values.password));
    if (!analysis.isValid) {
      errors.password =
        "Senha não atende aos requisitos de segurança (mín. 8 caracteres, maiúscula, minúscula, número e caractere especial)";
    }
  }
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "As senhas não coincidem";
  }
  if (!values.acceptTerms) errors.acceptTerms = "Aceite os Termos de Uso para continuar";
  if (!values.acceptLgpd) errors.acceptLgpd = "Aceite a Política de Privacidade para continuar";

  switch (role) {
    case "TUTOR": {
      requireString(values, "name", "Nome completo", errors);
      const cpfError = validateCpfField(values.cpf);
      if (cpfError) errors.cpf = cpfError;
      const birthError = validateBirthDate(String(values.birthDate ?? ""));
      if (birthError) errors.birthDate = birthError;
      const addr = values.address as FormValues | undefined;
      if (!addr?.street) errors["address.street"] = "Endereço é obrigatório";
      if (!addr?.city) errors["address.city"] = "Cidade é obrigatória";
      if (!addr?.state) errors["address.state"] = "Estado é obrigatório";
      requireArray(values, "primaryInterests", "Interesse principal", errors);
      break;
    }
    case "VETERINARIAN": {
      requireString(values, "name", "Nome completo", errors);
      const cpfError = validateCpfField(values.cpf);
      if (cpfError) errors.cpf = cpfError;
      requireString(values, "crmv", "CRMV", errors);
      requireString(values, "crmvState", "UF do CRMV", errors);
      requireString(values, "specialty", "Especialidade", errors);
      const vetAddr = values.address as FormValues | undefined;
      if (!vetAddr?.street) errors["address.street"] = "Endereço profissional é obrigatório";
      if (!vetAddr?.city) errors["address.city"] = "Cidade é obrigatória";
      if (!vetAddr?.state) errors["address.state"] = "Estado é obrigatório";
      break;
    }
    case "CLINIC": {
      requireString(values, "name", "Razão social", errors);
      requireString(values, "tradeName", "Nome fantasia", errors);
      const cnpjError = validateCnpjField(values.cnpj);
      if (cnpjError) errors.cnpj = cnpjError;
      requireString(values, "technicalResponsible", "Responsável técnico", errors);
      requireString(values, "responsibleCrmv", "CRMV do responsável", errors);
      requireString(values, "hours", "Horário de funcionamento", errors);
      requireArray(values, "services", "Serviços oferecidos", errors);
      const addr = values.address as FormValues | undefined;
      if (!addr?.street) errors["address.street"] = "Endereço é obrigatório";
      if (!addr?.city) errors["address.city"] = "Cidade é obrigatória";
      if (!addr?.state) errors["address.state"] = "Estado é obrigatório";
      break;
    }
    case "PETSHOP": {
      requireString(values, "name", "Razão social", errors);
      requireString(values, "tradeName", "Nome fantasia", errors);
      const cnpjError = validateCnpjField(values.cnpj);
      if (cnpjError) errors.cnpj = cnpjError;
      requireString(values, "responsible", "Responsável", errors);
      requireString(values, "hours", "Horário de funcionamento", errors);
      requireArray(values, "categories", "Categorias atendidas", errors);
      const addr = values.address as FormValues | undefined;
      if (!addr?.street) errors["address.street"] = "Endereço é obrigatório";
      if (!addr?.city) errors["address.city"] = "Cidade é obrigatória";
      if (!addr?.state) errors["address.state"] = "Estado é obrigatório";
      break;
    }
    case "SELLER": {
      requireString(values, "name", "Razão social", errors);
      requireString(values, "tradeName", "Nome fantasia", errors);
      const cnpjError = validateCnpjField(values.cnpj);
      if (cnpjError) errors.cnpj = cnpjError;
      requireString(values, "responsible", "Responsável", errors);
      requireArray(values, "productCategories", "Categorias de produtos", errors);
      requireString(values, "deliveryPolicy", "Política de entrega", errors);
      requireString(values, "exchangePolicy", "Política de troca", errors);
      const bank = values.bankData as FormValues | undefined;
      if (!bank?.pixKey) errors["bankData.pixKey"] = "Chave Pix é obrigatória";
      const addr = values.address as FormValues | undefined;
      if (!addr?.street) errors["address.street"] = "Endereço é obrigatório";
      if (!addr?.city) errors["address.city"] = "Cidade é obrigatória";
      if (!addr?.state) errors["address.state"] = "Estado é obrigatório";
      break;
    }
    case "SERVICE_PROVIDER": {
      requireString(values, "name", "Nome ou razão social", errors);
      const docType = String(values.documentType);
      const docError = docType === "CPF" ? validateCpfField(values.documentNumber) : validateCnpjField(values.documentNumber);
      if (docError) errors.documentNumber = docError;
      requireArray(values, "serviceTypes", "Tipo de serviço", errors);
      requireString(values, "serviceArea", "Área de atendimento", errors);
      requireString(values, "availability", "Disponibilidade", errors);
      const spAddr = values.address as FormValues | undefined;
      if (!spAddr?.street) errors["address.street"] = "Endereço é obrigatório";
      if (!spAddr?.city) errors["address.city"] = "Cidade é obrigatória";
      if (!spAddr?.state) errors["address.state"] = "Estado é obrigatório";
      break;
    }
    case "ONG": {
      const docType = String(values.documentType);
      if (docType === "CPF") {
        requireString(values, "name", "Nome completo do protetor", errors);
        const cpfError = validateCpfField(values.documentNumber);
        if (cpfError) errors.documentNumber = cpfError;
      } else {
        requireString(values, "name", "Razão social", errors);
        requireString(values, "tradeName", "Nome fantasia ou nome público da ONG", errors);
        const cnpjError = validateCnpjField(values.documentNumber);
        if (cnpjError) errors.documentNumber = cnpjError;
      }
      requireString(values, "responsible", "Responsável", errors);
      requireArray(values, "actionTypes", "Tipo de atuação", errors);
      const addr = values.address as FormValues | undefined;
      if (!addr?.street) errors["address.street"] = "Endereço é obrigatório";
      if (!addr?.city) errors["address.city"] = "Cidade é obrigatória";
      if (!addr?.state) errors["address.state"] = "Estado é obrigatório";
      break;
    }
  }

  return errors;
}

export function hasCriticalRegistrationErrors(role: RegistrationRole, values: FormValues): boolean {
  return Object.keys(validateRegistration(role, values)).length > 0;
}

function formatAddressLine(addr: FormValues): string {
  return [addr.street, addr.number, addr.district, addr.city, addr.state, addr.zipCode]
    .filter(Boolean)
    .join(", ");
}

export function buildRegisterPayload(role: RegistrationRole, values: FormValues) {
  const payload: FormValues = {
    role,
    email: values.email,
    password: values.password,
    passwordConfirm: values.confirmPassword,
    phone: onlyDigits(String(values.phone ?? "")),
    acceptTerms: true,
    acceptLgpd: true,
    documents: values.documents ?? [],
  };

  const copyKeys = [
    "name", "tradeName", "cpf", "birthDate", "petCount", "primaryInterests",
    "crmv", "crmvState", "specialty", "professionalAddress", "inPersonAvailable",
    "onlineAvailable", "averageConsultationPrice", "cnpj", "technicalResponsible",
    "responsibleCrmv", "hours", "services", "emergency", "responsible",
    "sellsProducts", "offersServices", "categories", "productCategories",
    "deliveryPolicy", "exchangePolicy", "bankData", "documentType", "documentNumber",
    "serviceTypes", "serviceArea", "homeService", "startingPrice", "availability",
    "actionTypes", "animalCapacity", "acceptsDonations",
  ];

  for (const key of copyKeys) {
    if (values[key] !== undefined && values[key] !== "") payload[key] = values[key];
  }

  const addr = values.address as FormValues | undefined;
  if (addr && (addr.street || addr.city)) {
    payload.address = addr;
  }

  if (role === "VETERINARIAN" && addr?.street) {
    payload.professionalAddress = formatAddressLine(addr);
  }

  if (payload.averageConsultationPrice !== undefined && payload.averageConsultationPrice !== "") {
    payload.averageConsultationPrice = Number(payload.averageConsultationPrice);
  }
  if (payload.startingPrice !== undefined && payload.startingPrice !== "") {
    payload.startingPrice = Number(payload.startingPrice);
  }
  if (payload.petCount !== undefined) payload.petCount = Number(payload.petCount);
  if (payload.animalCapacity !== undefined) payload.animalCapacity = Number(payload.animalCapacity);

  return payload;
}

export { USER_MESSAGES };
