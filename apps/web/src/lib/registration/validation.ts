import type { FormValues, RegistrationRole } from "./personas";
import { analyzePassword } from "@/lib/password/strength";

function digits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

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
  requireString(values, "password", "Senha", errors);
  if (values.password) {
    const analysis = analyzePassword(String(values.password));
    if (!analysis.isValid) {
      errors.password = "Senha não atende aos requisitos de segurança (mín. 8 caracteres, maiúscula, minúscula, número e caractere especial)";
    }
  }
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "As senhas não coincidem";
  }
  if (!values.acceptTerms) errors.acceptTerms = "Aceite os termos de uso";
  if (!values.acceptLgpd) errors.acceptLgpd = "Aceite a política LGPD";

  switch (role) {
    case "TUTOR": {
      requireString(values, "name", "Nome completo", errors);
      const cpf = digits(values.cpf);
      if (cpf.length !== 11) errors.cpf = "CPF inválido";
      requireString(values, "birthDate", "Data de nascimento", errors);
      const addr = values.address as FormValues | undefined;
      if (!addr?.street) errors["address.street"] = "Endereço é obrigatório";
      if (!addr?.city) errors["address.city"] = "Cidade é obrigatória";
      if (!addr?.state) errors["address.state"] = "Estado é obrigatório";
      requireArray(values, "primaryInterests", "Interesse principal", errors);
      break;
    }
    case "VETERINARIAN": {
      requireString(values, "name", "Nome completo", errors);
      if (digits(values.cpf).length !== 11) errors.cpf = "CPF inválido";
      requireString(values, "crmv", "CRMV", errors);
      requireString(values, "crmvState", "UF do CRMV", errors);
      requireString(values, "specialty", "Especialidade", errors);
      requireString(values, "professionalAddress", "Endereço profissional", errors);
      break;
    }
    case "CLINIC": {
      requireString(values, "name", "Razão social", errors);
      requireString(values, "tradeName", "Nome fantasia", errors);
      if (digits(values.cnpj).length !== 14) errors.cnpj = "CNPJ inválido";
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
      if (digits(values.cnpj).length !== 14) errors.cnpj = "CNPJ inválido";
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
      if (digits(values.cnpj).length !== 14) errors.cnpj = "CNPJ inválido";
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
      const doc = digits(values.documentNumber);
      if (docType === "CPF" && doc.length !== 11) errors.documentNumber = "CPF inválido";
      if (docType === "CNPJ" && doc.length !== 14) errors.documentNumber = "CNPJ inválido";
      requireArray(values, "serviceTypes", "Tipo de serviço", errors);
      requireString(values, "serviceArea", "Área de atendimento", errors);
      requireString(values, "availability", "Disponibilidade", errors);
      break;
    }
    case "ONG": {
      requireString(values, "name", "Nome da ONG ou protetor", errors);
      const docType = String(values.documentType);
      const doc = digits(values.documentNumber);
      if (docType === "CPF" && doc.length !== 11) errors.documentNumber = "CPF inválido";
      if (docType === "CNPJ" && doc.length !== 14) errors.documentNumber = "CNPJ inválido";
      requireString(values, "responsible", "Responsável", errors);
      requireArray(values, "actionTypes", "Tipo de atuação", errors);
      const addr = values.address as FormValues | undefined;
      if (!addr?.street) errors["address.street"] = "Endereço é obrigatório";
      if (!addr?.city) errors["address.city"] = "Cidade é obrigatória";
      if (!addr?.state) errors["address.state"] = "Estado é obrigatório";
      break;
    }
    case "ADMIN": {
      requireString(values, "name", "Nome completo", errors);
      if (digits(values.cpf).length !== 11) errors.cpf = "CPF inválido";
      requireString(values, "corporateEmail", "E-mail corporativo", errors);
      requireString(values, "jobTitle", "Cargo", errors);
      requireString(values, "accessLevel", "Nível de acesso", errors);
      break;
    }
  }

  return errors;
}

export function buildRegisterPayload(role: RegistrationRole, values: FormValues) {
  const payload: FormValues = {
    role,
    email: values.email,
    password: values.password,
    phone: values.phone,
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
    "actionTypes", "animalCapacity", "acceptsDonations", "corporateEmail",
    "jobTitle", "accessLevel",
  ];

  for (const key of copyKeys) {
    if (values[key] !== undefined && values[key] !== "") payload[key] = values[key];
  }

  const addr = values.address as FormValues | undefined;
  if (addr && (addr.street || addr.city)) {
    payload.address = addr;
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
