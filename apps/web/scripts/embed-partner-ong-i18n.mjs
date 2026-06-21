/**
 * Patches pt-BR.json, en.json, es.json with auth.register.partner / auth.register.ong
 * and auth.terms.partner / auth.terms.ong keys used by use-register-copy.ts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, "../src/i18n/locales");

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      target[k] = deepMerge(target[k] ?? {}, v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

const partnerRegisterPt = {
  typeHeading: "Qual é o seu tipo de atuação?",
  steps: {
    type: "Tipo",
    legal: "Representante",
    corporate: "Corporativo",
    professional: "Profissional",
    operation: "Funcionamento",
    documentation: "Documentação",
    financial: "Financeiro",
    security: "Segurança",
  },
  sections: {
    legal: "Dados do representante legal",
    corporate: "Dados corporativos",
    professional: "Dados profissionais",
    operation: "Dados de funcionamento",
    financial: "Dados financeiros",
    security: "Segurança",
    address: "Endereço completo",
  },
  fields: {
    responsibleName: "Nome completo do responsável",
    activityStart: "Data de início das atividades",
    businessName: "Nome comercial",
    corporateType: "Tipo corporativo",
    corporateTypeOther: "Informe o tipo corporativo",
    professionalName: "Nome comercial / profissional",
    activityArea: "Área de atuação",
    activityAreaSearch: "Buscar área...",
    activityAreaOther: "Descreva sua área de atuação",
    businessDescription: "Descrição do negócio",
    streetType: "Tipo de logradouro",
    streetTypeOther: "Informe o tipo de logradouro",
    openTime: "Horário de abertura",
    closeTime: "Horário de fechamento",
    logisticsNotes: "Observações logísticas",
    pixKeyType: "Tipo de chave Pix",
    pixKey: "Chave Pix",
    bank: "Banco",
    bankOther: "Informe o banco",
    agency: "Agência",
    account: "Conta corrente",
    accountDigit: "Dígito",
    accountType: "Tipo de conta",
    accountHolder: "Titular da conta",
    accountHolderDoc: "CPF/CNPJ do titular",
    instagram: "Instagram",
    website: "Site",
    linkedin: "LinkedIn",
    deliveryLegend: "Entrega e tele-busca",
    paymentLegend: "Formas de pagamento aceitas",
  },
  legends: {
    partnerType: "Tipo de parceiro *",
    activityAreas: "Selecione uma ou mais áreas",
    operation: "Funcionamento *",
    weekdays: "Dias de atendimento *",
    serviceRadius: "Raio de atendimento *",
    delivery: "Entrega e tele-busca",
    paymentMethods: "Formas de pagamento aceitas *",
  },
  actions: {
    continue: "Continuar",
    finish: "Concluir cadastro",
    finishing: "Concluindo...",
    select: "Selecione",
  },
  hints: {
    descriptionCount: "{count} / 800",
    byAppointment: "O cliente poderá solicitar horários conforme sua disponibilidade.",
    emergency: "Atendimento emergencial — dias e horários fixos não são obrigatórios.",
    hours24: "Atendimento 24 horas — dias e horários fixos não são obrigatórios.",
    logisticsPlaceholder: "Taxa, raio ou sob consulta",
    usernameAvailable: "Nome de usuário disponível",
  },
  cnpj: {
    loading: "Consultando CNPJ na Receita Federal via BrasilAPI...",
    notFound: "CNPJ não encontrado na consulta.",
    filled: "Situação: {status}. Dados preenchidos automaticamente — revise se necessário.",
    unavailable: "Consulta de CNPJ indisponível no momento. Preencha manualmente.",
  },
  success: {
    title: "Cadastro de parceiro concluído com sucesso.",
    description: "Sua conta está ativa. Acesse o painel para configurar produtos e serviços.",
  },
  validation: {
    partnerTypeRequired: "Selecione o tipo de parceiro para continuar.",
    usernameInvalid: "Nome de usuário inválido (4–30 caracteres).",
    businessNameRequired: "Nome comercial obrigatório.",
    legalNameRequired: "Razão social obrigatória.",
    corporateTypeRequired: "Selecione o tipo corporativo.",
    corporateTypeOtherRequired: "Informe o tipo corporativo.",
    activityAreasRequired: "Selecione ao menos uma área de atuação.",
    activityAreasOtherRequired: "Descreva sua área de atuação.",
    descriptionTooShort: "Descreva melhor sua atuação profissional.",
    descriptionTooLong: "A descrição deve ter no máximo 800 caracteres.",
    zipCodeInvalid: "Digite um CEP válido.",
    streetTypeRequired: "Selecione o tipo de logradouro.",
    streetTypeOtherRequired: "Informe o tipo de logradouro.",
    streetRequired: "Logradouro obrigatório.",
    numberRequired: "Número obrigatório.",
    districtRequired: "Bairro obrigatório.",
    cityRequired: "Cidade obrigatória.",
    stateRequired: "UF obrigatória.",
    operationModesRequired: "Selecione ao menos uma forma de funcionamento.",
    operationScheduleRequired: "Informe os dias e horários de funcionamento.",
    closeTimeAfterOpen: "Horário de fechamento deve ser posterior ao de abertura.",
    serviceRadiusRequired: "Selecione o raio de atendimento.",
    paymentMethodsRequired: "Selecione ao menos uma forma de pagamento.",
    pixKeyRequired: "Informe a chave Pix.",
    bankRequired: "Preencha os dados bancários.",
    bankOtherRequired: "Informe o banco.",
    passwordInvalid: "Senha inválida.",
    docsPending: "Documentos obrigatórios pendentes.",
    docsAutonomousMissing: "Envie o documento do responsável legal e o comprovante de residência.",
    docsCorporateMissing: "Envie todos os documentos obrigatórios para concluir o cadastro.",
    waitCpf: "Aguarde a verificação do CPF.",
    waitCnpj: "Aguarde a verificação do CNPJ.",
  },
  options: {
    activityAreas: {
      SAUDE_ANIMAL: "Saúde Animal",
      ESTETICA_BEM_ESTAR: "Estética e Bem-Estar",
      COMERCIO_PET: "Comércio Pet",
      ALIMENTACAO: "Alimentação",
      HOSPEDAGEM_CRECHE: "Hospedagem e Creche",
      TREINAMENTO: "Treinamento e Comportamento",
      TRANSPORTE: "Transporte",
      REPRODUCAO: "Reprodução e Genética",
      EVENTOS: "Eventos e Lazer",
      SERVICOS_TECNICOS: "Serviços Técnicos",
      EQUINOS: "Equinos",
      BOVINOS_AGRO: "Bovinos e Agro",
      AQUARISMO: "Aquarismo",
      EXOTICOS: "Animais Exóticos",
      TECNOLOGIA: "Tecnologia",
      EDUCACAO: "Educação",
      PROTECAO_ANIMAL: "Proteção Animal",
      OUTROS: "Outros",
    },
    operationModes: {
      FIXED_HOURS: "Horário Fixo",
      SPECIFIC_DAYS: "Horários Específicos",
      BY_APPOINTMENT: "Sob Agendamento",
      EMERGENCY: "Atendimento Emergencial",
      HOURS_24: "Atendimento 24 Horas",
    },
    weekdays: {
      MON: "Segunda-feira",
      TUE: "Terça-feira",
      WED: "Quarta-feira",
      THU: "Quinta-feira",
      FRI: "Sexta-feira",
      SAT: "Sábado",
      SUN: "Domingo",
    },
    serviceRadius: {
      LOCAL_ONLY: "Atendo apenas no local",
      KM_2: "Até 2 km",
      KM_5: "Até 5 km",
      KM_10: "Até 10 km",
      KM_20: "Até 20 km",
      KM_50: "Até 50 km",
      REGIONAL: "Atendimento regional",
      NATIONAL: "Atendimento nacional",
      REMOTE: "Atendimento online/remoto",
    },
    deliveryOptions: {
      DELIVERY: "Realizo entrega",
      TELEBUS: "Realizo tele-busca",
      CLIENT_DROPOFF: "Cliente entrega no local",
      HOME_SERVICE: "Atendimento domiciliar",
    },
    streetTypes: {
      RUA: "Rua",
      AVENIDA: "Avenida",
      TRAVESSA: "Travessa",
      ALAMEDA: "Alameda",
      PRACA: "Praça",
      ESTRADA: "Estrada",
      RODOVIA: "Rodovia",
      LADEIRA: "Ladeira",
      VIELA: "Viela",
      CONDOMINIO: "Condomínio",
      SITIO: "Sítio",
      FAZENDA: "Fazenda",
      CHACARA: "Chácara",
      COMUNIDADE: "Comunidade",
      DISTRITO: "Distrito",
      OUTRO: "Outro",
    },
    corporateTypes: {
      MEI: "MEI",
      MICROEMPRESA: "Microempresa",
      EPP: "Empresa de Pequeno Porte",
      LTDA: "Empresa Ltda.",
      SOCIEDADE_SIMPLES: "Sociedade Simples",
      ASSOCIACAO: "Associação",
      COOPERATIVA: "Cooperativa",
      PRESTADORA: "Prestadora de Serviço",
      OUTRO: "Outro",
    },
    paymentMethods: {
      PIX: "Pix",
      DINHEIRO: "Dinheiro",
      CREDIT_CARD: "Cartão de crédito",
      DEBIT_CARD: "Cartão de débito",
      BOLETO: "Boleto",
      BANK_TRANSFER: "Transferência bancária",
      PAYMENT_LINK: "Link de pagamento",
      DIGITAL_WALLET: "Carteira digital",
      APPLE_PAY: "Apple Pay",
      GOOGLE_PAY: "Google Pay",
      MERCADO_PAGO: "Mercado Pago",
      PICPAY: "PicPay",
      PAYPAL: "PayPal",
      PAGSEGURO: "PagSeguro",
      STRIPE: "Stripe",
      PAGAR_ME: "Pagar.me",
      ON_SITE: "Pagamento no local",
      ON_PICKUP: "Pagamento na retirada",
      ON_DELIVERY: "Pagamento na entrega",
      MONTHLY: "Assinatura mensal",
      ON_REQUEST: "Sob consulta",
    },
    pixKeyTypes: {
      CPF: "CPF",
      CNPJ: "CNPJ",
      EMAIL: "E-mail",
      PHONE: "Telefone",
      RANDOM: "Chave aleatória",
    },
    banks: {
      BB: "Banco do Brasil",
      CAIXA: "Caixa Econômica Federal",
      BRADESCO: "Bradesco",
      ITAU: "Itaú",
      SANTANDER: "Santander",
      NUBANK: "Nubank",
      INTER: "Inter",
      C6: "C6 Bank",
      SICREDI: "Sicredi",
      SICOOB: "Sicoob",
      PAN: "Banco Pan",
      BTG: "BTG Pactual",
      MERCADO_PAGO: "Mercado Pago",
      PAGSEGURO: "PagSeguro",
      STONE: "Stone",
      PICPAY: "PicPay",
      OUTROS: "Outros",
    },
    accountTypes: {
      CHECKING: "Corrente",
      SAVINGS: "Poupança",
      PAYMENT: "Pagamento",
    },
    partnerTypes: {
      AUTONOMOUS: "Profissional Autônomo",
      CORPORATE: "MEI / Empresa / Prestadora de Serviço",
    },
    partnerTypeDescriptions: {
      AUTONOMOUS: "Sou profissional independente e atuo em nome próprio.",
      CORPORATE: "Tenho CNPJ, nome comercial, razão social ou presto serviços como pessoa jurídica.",
    },
  },
  documentation: {
    title: "Documentação e Verificação",
    description:
      "Envie os documentos obrigatórios para concluir o cadastro e, se desejar, complemente com documentos adicionais.",
    progressAria: "Progresso de documentos obrigatórios",
    progressCount: "{done} de {total} obrigatório(s) enviado(s)",
    requiredHeading: "Documentos obrigatórios",
    optionalHeading: "Documentos adicionais (opcional)",
    requiredBadge: "Obrigatório",
    attach: "Anexar",
    replace: "Substituir",
    remove: "Remover",
    summaryAria: "Resumo dos documentos anexados",
    fileTooLarge: "Arquivo excede {size}.",
    formatNotAllowed: "Formato não permitido. Use PDF, JPG, PNG ou WEBP.",
    status: {
      pending: "Não enviado",
      uploaded: "Enviado",
      validated: "Validado",
      rejected: "Rejeitado",
    },
  },
};

const ongRegisterPt = {
  typeHeading: "Como você atua na proteção animal?",
  steps: {
    type: "Tipo",
    responsible: "Responsável",
    responsibleInstitution: "Representante",
    institutional: "Institucional",
    activity: "Atuação",
    profile: "Perfil",
    documentation: "Documentação",
    security: "Segurança",
  },
  sections: {
    responsible: "Responsável",
    responsibleInstitution: "Representante legal",
    institutional: "Dados institucionais",
    activity: "Atuação",
    profileIndividual: "Perfil da causa",
    profileInstitution: "Perfil institucional",
    security: "Segurança",
  },
  fields: {
    representativeRole: "Cargo do representante",
    representativeRoleOther: "Informe o cargo",
    ongName: "Nome da ONG",
    foundedDate: "Data de fundação",
    focusArea: "Área de atuação",
    focusAreaOther: "Descreva a área",
    city: "Cidade",
    state: "Estado",
    statePlaceholder: "UF",
    actionAreaOther: "Descreva a área de atuação",
    descriptionIndividual: "Descrição da causa *",
    descriptionInstitution: "Descrição institucional *",
    mission: "Missão",
    vision: "Visão",
    animalCapacity: "Quantidade aproximada de animais atendidos",
    coverIndividual: "Foto de capa",
    coverInstitution: "Imagem de capa",
    pixDonations: "Pix para doações",
    facebook: "Facebook",
    youtube: "YouTube",
    uploadImage: "Enviar imagem",
    replaceImage: "Substituir imagem",
  },
  legends: {
    ongType: "Tipo de cadastro *",
    actionAreas: "Áreas de atuação *",
  },
  hints: {
    activityDateRange: "Entre {min} e {max}.",
    documentLabel: "Documento principal: {doc}.",
    usernameTaken: "Usuário já cadastrado.",
  },
  success: {
    title: "Conta criada com sucesso!",
    description: "Sua conta ONG está ativa com acesso imediato ao painel.",
  },
  validation: {
    ongTypeRequired: "Selecione como você atua na proteção animal.",
    representativeRoleRequired: "Informe o cargo do representante.",
    representativeRoleOtherRequired: "Informe o cargo.",
    ongNameRequired: "Nome da ONG obrigatório.",
    foundedDateRequired: "Data de fundação obrigatória.",
    focusAreaRequired: "Selecione a área de atuação.",
    focusAreaOtherRequired: "Informe a área de atuação.",
    actionTypesRequired: "Selecione ao menos uma área de atuação.",
    descriptionIndividual: "Descreva melhor sua causa.",
    descriptionInstitution: "Descreva melhor a instituição.",
    missionRequired: "Informe a missão da instituição.",
    visionRequired: "Informe a visão da instituição.",
    docsPending: "Envie os documentos obrigatórios para continuar.",
  },
  options: {
    ongTypes: {
      INDIVIDUAL: "Protetor Individual",
      INSTITUTION: "ONG / Instituto / Associação",
    },
    ongTypeDescriptions: {
      INDIVIDUAL:
        "Atuo individualmente realizando resgates, adoções, cuidados, lares temporários e ações de proteção animal.",
      INSTITUTION:
        "Represento uma organização, instituto, associação ou entidade voltada à proteção animal.",
    },
    actionAreas: {
      RESCUE: "Resgate Animal",
      ADOPTION: "Adoção",
      FOSTER: "Lar Temporário",
      NEUTERING: "Castração",
      FEEDING: "Alimentação Animal",
      EDUCATION: "Educação Animal",
      AWARENESS: "Conscientização",
      PROTECTION: "Proteção Animal",
      DEFENSE: "Defesa Animal",
      EMERGENCY: "Atendimento Emergencial",
      CAMPAIGNS: "Campanhas Solidárias",
      FUNDRAISING: "Arrecadações",
      ADOPTION_FAIRS: "Feiras de Adoção",
      SHELTER: "Abrigo Animal",
      SOCIAL_VET: "Hospital Veterinário Social",
      OUTROS: "Outros",
    },
    representativeRoles: {
      PRESIDENT: "Presidente",
      DIRECTOR: "Diretor(a)",
      FOUNDER: "Fundador(a)",
      COORDINATOR: "Coordenador(a)",
      LEGAL_REP: "Representante Legal",
      OTHER: "Outro",
    },
    focusAreas: {
      PROTECTION: "Proteção Animal",
      RESCUE_ADOPTION: "Resgate e Adoção",
      HEALTH: "Saúde Animal",
      EDUCATION: "Educação e Conscientização",
      RIGHTS: "Defesa dos Direitos Animais",
      OTHER: "Outro",
    },
  },
  documentation: {
    title: "Documentação",
    description:
      "Envie os documentos obrigatórios para concluir o cadastro e, se desejar, complemente com documentos adicionais.",
    progressAria: "Progresso de documentos obrigatórios",
    progressCount: "{done} de {total} obrigatório(s) enviado(s)",
    requiredHeading: "Documentos obrigatórios",
    optionalHeading: "Documentos adicionais (opcional)",
    requiredBadge: "Obrigatório",
    attach: "Anexar",
    replace: "Substituir",
    remove: "Remover",
    summaryAria: "Resumo dos documentos anexados",
    fileTooLarge: "Arquivo excede {size}.",
    formatNotAllowed: "Formato não permitido. Use PDF, JPG, PNG ou WEBP.",
    status: {
      pending: "Não enviado",
      uploaded: "Enviado",
      validated: "Validado",
      rejected: "Rejeitado",
    },
  },
};

const termsPt = {
  partner: {
    legalHeading: "Termos do Parceiro EcoPet",
    legalSubheading:
      "Documentos jurídicos exclusivos para parceiros — independentes dos termos do Cliente EcoPet.",
    termsPreview:
      "Estes Termos regulam exclusivamente a parceria comercial na EcoPet: cadastro, produtos, serviços, agendamentos, entregas, tele-busca, transporte de animais, reputação, verificação documental, proteção animal e responsabilidades do Parceiro.",
    privacyPreview:
      "Esta Política descreve exclusivamente como a EcoPet trata dados de Parceiros — CPF, CNPJ, contato, endereço, financeiro, documentos, fotos, logotipo, acesso e histórico — em conformidade com a LGPD.",
  },
  ong: {
    legalHeading: "Termos da ONG EcoPet",
    legalSubheading:
      "Documentos jurídicos exclusivos para ONGs e protetores — independentes dos termos do Cliente EcoPet.",
    termsPreview:
      "Estes Termos regulam exclusivamente a colaboração de ONGs e protetores individuais na EcoPet: resgate, adoção responsável, lares temporários, campanhas, arrecadações, feiras de adoção, divulgação de animais, uso ético da plataforma, combate a fraudes e maus-tratos, além das responsabilidades do cadastrado e limitações da EcoPet.",
    privacyPreview:
      "Esta Política descreve exclusivamente como a EcoPet trata dados de ONGs e protetores individuais — CPF, CNPJ, representante legal, contato, endereço, documentos, comprovantes, fotografias, imagens de animais, autenticação, cookies e histórico — em conformidade com a LGPD.",
  },
};

/** English translations */
const partnerRegisterEn = JSON.parse(JSON.stringify(partnerRegisterPt));
Object.assign(partnerRegisterEn, {
  typeHeading: "What is your type of operation?",
  steps: {
    type: "Type",
    legal: "Representative",
    corporate: "Corporate",
    professional: "Professional",
    operation: "Operations",
    documentation: "Documentation",
    financial: "Financial",
    security: "Security",
  },
  sections: {
    legal: "Legal representative details",
    corporate: "Corporate details",
    professional: "Professional details",
    operation: "Operating details",
    financial: "Financial details",
    security: "Security",
    address: "Full address",
  },
  fields: {
    responsibleName: "Full name of representative",
    activityStart: "Activity start date",
    businessName: "Trade name",
    corporateType: "Corporate type",
    corporateTypeOther: "Specify corporate type",
    professionalName: "Trade / professional name",
    activityArea: "Area of activity",
    activityAreaSearch: "Search area...",
    activityAreaOther: "Describe your area of activity",
    businessDescription: "Business description",
    streetType: "Street type",
    streetTypeOther: "Specify street type",
    openTime: "Opening time",
    closeTime: "Closing time",
    logisticsNotes: "Logistics notes",
    pixKeyType: "Pix key type",
    pixKey: "Pix key",
    bank: "Bank",
    bankOther: "Specify bank",
    agency: "Branch",
    account: "Account number",
    accountDigit: "Digit",
    accountType: "Account type",
    accountHolder: "Account holder",
    accountHolderDoc: "Holder CPF/CNPJ",
    instagram: "Instagram",
    website: "Website",
    linkedin: "LinkedIn",
  },
  legends: {
    partnerType: "Partner type *",
    activityAreas: "Select one or more areas",
    operation: "Operations *",
    weekdays: "Service days *",
    serviceRadius: "Service radius *",
    delivery: "Delivery and pickup",
    paymentMethods: "Accepted payment methods *",
  },
  actions: {
    continue: "Continue",
    finish: "Complete registration",
    finishing: "Completing...",
    select: "Select",
  },
  hints: {
    descriptionCount: "{count} / 800",
    byAppointment: "Customers can request times according to your availability.",
    emergency: "Emergency service — fixed days and hours are not required.",
    hours24: "24-hour service — fixed days and hours are not required.",
    logisticsPlaceholder: "Fee, radius or on request",
    usernameAvailable: "Username available",
  },
  cnpj: {
    loading: "Looking up CNPJ via BrasilAPI...",
    notFound: "CNPJ not found in lookup.",
    filled: "Status: {status}. Data filled automatically — please review if needed.",
    unavailable: "CNPJ lookup unavailable. Please fill in manually.",
  },
  success: {
    title: "Partner registration completed successfully.",
    description: "Your account is active. Access the dashboard to set up products and services.",
  },
  validation: {
    partnerTypeRequired: "Select a partner type to continue.",
    usernameInvalid: "Invalid username (4–30 characters).",
    businessNameRequired: "Trade name is required.",
    legalNameRequired: "Legal name is required.",
    corporateTypeRequired: "Select a corporate type.",
    corporateTypeOtherRequired: "Specify the corporate type.",
    activityAreasRequired: "Select at least one area of activity.",
    activityAreasOtherRequired: "Describe your area of activity.",
    descriptionTooShort: "Please describe your professional activity in more detail.",
    descriptionTooLong: "Description must be at most 800 characters.",
    zipCodeInvalid: "Enter a valid postal code.",
    streetTypeRequired: "Select a street type.",
    streetTypeOtherRequired: "Specify the street type.",
    streetRequired: "Street is required.",
    numberRequired: "Number is required.",
    districtRequired: "District is required.",
    cityRequired: "City is required.",
    stateRequired: "State is required.",
    operationModesRequired: "Select at least one operating mode.",
    operationScheduleRequired: "Enter operating days and hours.",
    closeTimeAfterOpen: "Closing time must be after opening time.",
    serviceRadiusRequired: "Select a service radius.",
    paymentMethodsRequired: "Select at least one payment method.",
    pixKeyRequired: "Enter the Pix key.",
    bankRequired: "Fill in bank details.",
    bankOtherRequired: "Specify the bank.",
    passwordInvalid: "Invalid password.",
    docsPending: "Required documents pending.",
    docsAutonomousMissing: "Upload the legal representative ID and proof of residence.",
    docsCorporateMissing: "Upload all required documents to complete registration.",
    waitCpf: "Please wait for CPF verification.",
    waitCnpj: "Please wait for CNPJ verification.",
  },
  documentation: {
    title: "Documentation and verification",
    description:
      "Upload required documents to complete registration and optionally add additional documents.",
    progressAria: "Required documents progress",
    progressCount: "{done} of {total} required uploaded",
    requiredHeading: "Required documents",
    optionalHeading: "Additional documents (optional)",
    requiredBadge: "Required",
    attach: "Attach",
    replace: "Replace",
    remove: "Remove",
    summaryAria: "Attached documents summary",
    fileTooLarge: "File exceeds {size}.",
    formatNotAllowed: "Format not allowed. Use PDF, JPG, PNG or WEBP.",
    status: {
      pending: "Not uploaded",
      uploaded: "Uploaded",
      validated: "Validated",
      rejected: "Rejected",
    },
  },
});
partnerRegisterEn.options.partnerTypes = {
  AUTONOMOUS: "Self-employed professional",
  CORPORATE: "MEI / Company / Service provider",
};
partnerRegisterEn.options.partnerTypeDescriptions = {
  AUTONOMOUS: "I am an independent professional working in my own name.",
  CORPORATE: "I have a CNPJ, trade name, legal name or provide services as a legal entity.",
};
partnerRegisterEn.options.activityAreas = {
  SAUDE_ANIMAL: "Animal health",
  ESTETICA_BEM_ESTAR: "Grooming and wellness",
  COMERCIO_PET: "Pet retail",
  ALIMENTACAO: "Food",
  HOSPEDAGEM_CRECHE: "Boarding and daycare",
  TREINAMENTO: "Training and behavior",
  TRANSPORTE: "Transport",
  REPRODUCAO: "Breeding and genetics",
  EVENTOS: "Events and leisure",
  SERVICOS_TECNICOS: "Technical services",
  EQUINOS: "Equines",
  BOVINOS_AGRO: "Cattle and agro",
  AQUARISMO: "Aquarium",
  EXOTICOS: "Exotic animals",
  TECNOLOGIA: "Technology",
  EDUCACAO: "Education",
  PROTECAO_ANIMAL: "Animal protection",
  OUTROS: "Other",
};
partnerRegisterEn.options.operationModes = {
  FIXED_HOURS: "Fixed hours",
  SPECIFIC_DAYS: "Specific hours",
  BY_APPOINTMENT: "By appointment",
  EMERGENCY: "Emergency service",
  HOURS_24: "24-hour service",
};
partnerRegisterEn.options.weekdays = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};
partnerRegisterEn.options.serviceRadius = {
  LOCAL_ONLY: "On-site only",
  KM_2: "Up to 2 km",
  KM_5: "Up to 5 km",
  KM_10: "Up to 10 km",
  KM_20: "Up to 20 km",
  KM_50: "Up to 50 km",
  REGIONAL: "Regional service",
  NATIONAL: "National service",
  REMOTE: "Online / remote service",
};
partnerRegisterEn.options.deliveryOptions = {
  DELIVERY: "I offer delivery",
  TELEBUS: "I offer pickup service",
  CLIENT_DROPOFF: "Customer drops off on site",
  HOME_SERVICE: "Home service",
};
partnerRegisterEn.options.streetTypes = {
  RUA: "Street",
  AVENIDA: "Avenue",
  TRAVESSA: "Lane",
  ALAMEDA: "Alley",
  PRACA: "Square",
  ESTRADA: "Road",
  RODOVIA: "Highway",
  LADEIRA: "Hill",
  VIELA: "Path",
  CONDOMINIO: "Condominium",
  SITIO: "Farm (sitio)",
  FAZENDA: "Farm",
  CHACARA: "Country house",
  COMUNIDADE: "Community",
  DISTRITO: "District",
  OUTRO: "Other",
};
partnerRegisterEn.options.corporateTypes = {
  MEI: "MEI",
  MICROEMPRESA: "Microenterprise",
  EPP: "Small business (EPP)",
  LTDA: "Ltd. company",
  SOCIEDADE_SIMPLES: "Simple partnership",
  ASSOCIACAO: "Association",
  COOPERATIVA: "Cooperative",
  PRESTADORA: "Service provider",
  OUTRO: "Other",
};
partnerRegisterEn.options.paymentMethods = {
  PIX: "Pix",
  DINHEIRO: "Cash",
  CREDIT_CARD: "Credit card",
  DEBIT_CARD: "Debit card",
  BOLETO: "Bank slip",
  BANK_TRANSFER: "Bank transfer",
  PAYMENT_LINK: "Payment link",
  DIGITAL_WALLET: "Digital wallet",
  APPLE_PAY: "Apple Pay",
  GOOGLE_PAY: "Google Pay",
  MERCADO_PAGO: "Mercado Pago",
  PICPAY: "PicPay",
  PAYPAL: "PayPal",
  PAGSEGURO: "PagSeguro",
  STRIPE: "Stripe",
  PAGAR_ME: "Pagar.me",
  ON_SITE: "Pay on site",
  ON_PICKUP: "Pay on pickup",
  ON_DELIVERY: "Pay on delivery",
  MONTHLY: "Monthly subscription",
  ON_REQUEST: "On request",
};
partnerRegisterEn.options.pixKeyTypes = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "Email",
  PHONE: "Phone",
  RANDOM: "Random key",
};
partnerRegisterEn.options.banks = {
  BB: "Banco do Brasil",
  CAIXA: "Caixa Econômica Federal",
  BRADESCO: "Bradesco",
  ITAU: "Itaú",
  SANTANDER: "Santander",
  NUBANK: "Nubank",
  INTER: "Inter",
  C6: "C6 Bank",
  SICREDI: "Sicredi",
  SICOOB: "Sicoob",
  PAN: "Banco Pan",
  BTG: "BTG Pactual",
  MERCADO_PAGO: "Mercado Pago",
  PAGSEGURO: "PagSeguro",
  STONE: "Stone",
  PICPAY: "PicPay",
  OUTROS: "Other",
};
partnerRegisterEn.options.accountTypes = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  PAYMENT: "Payment",
};

const ongRegisterEn = JSON.parse(JSON.stringify(ongRegisterPt));
Object.assign(ongRegisterEn, {
  typeHeading: "How do you work in animal protection?",
  steps: {
    type: "Type",
    responsible: "Responsible",
    responsibleInstitution: "Representative",
    institutional: "Institutional",
    activity: "Activity",
    profile: "Profile",
    documentation: "Documentation",
    security: "Security",
  },
  sections: {
    responsible: "Responsible person",
    responsibleInstitution: "Legal representative",
    institutional: "Institutional details",
    activity: "Activity",
    profileIndividual: "Cause profile",
    profileInstitution: "Institutional profile",
    security: "Security",
  },
  fields: {
    representativeRole: "Representative role",
    representativeRoleOther: "Specify role",
    ongName: "NGO name",
    foundedDate: "Founded date",
    focusArea: "Focus area",
    focusAreaOther: "Describe the area",
    city: "City",
    state: "State",
    statePlaceholder: "State",
    actionAreaOther: "Describe area of activity",
    descriptionIndividual: "Cause description *",
    descriptionInstitution: "Institutional description *",
    mission: "Mission",
    vision: "Vision",
    animalCapacity: "Approximate number of animals served",
    coverIndividual: "Cover photo",
    coverInstitution: "Cover image",
    pixDonations: "Pix for donations",
    facebook: "Facebook",
    youtube: "YouTube",
    uploadImage: "Upload image",
    replaceImage: "Replace image",
  },
  legends: {
    ongType: "Registration type *",
    actionAreas: "Areas of activity *",
  },
  hints: {
    activityDateRange: "Between {min} and {max}.",
    documentLabel: "Primary document: {doc}.",
    usernameTaken: "Username already registered.",
  },
  success: {
    title: "Account created successfully!",
    description: "Your NGO account is active with immediate dashboard access.",
  },
  validation: {
    ongTypeRequired: "Select how you work in animal protection.",
    representativeRoleRequired: "Enter the representative role.",
    representativeRoleOtherRequired: "Specify the role.",
    ongNameRequired: "NGO name is required.",
    foundedDateRequired: "Founded date is required.",
    focusAreaRequired: "Select a focus area.",
    focusAreaOtherRequired: "Specify the focus area.",
    actionTypesRequired: "Select at least one area of activity.",
    descriptionIndividual: "Please describe your cause in more detail.",
    descriptionInstitution: "Please describe the institution in more detail.",
    missionRequired: "Enter the institution mission.",
    visionRequired: "Enter the institution vision.",
    docsPending: "Upload required documents to continue.",
  },
  documentation: {
    title: "Documentation",
    description:
      "Upload required documents to complete registration and optionally add additional documents.",
    progressAria: "Required documents progress",
    progressCount: "{done} of {total} required uploaded",
    requiredHeading: "Required documents",
    optionalHeading: "Additional documents (optional)",
    requiredBadge: "Required",
    attach: "Attach",
    replace: "Replace",
    remove: "Remove",
    summaryAria: "Attached documents summary",
    fileTooLarge: "File exceeds {size}.",
    formatNotAllowed: "Format not allowed. Use PDF, JPG, PNG or WEBP.",
    status: {
      pending: "Not uploaded",
      uploaded: "Uploaded",
      validated: "Validated",
      rejected: "Rejected",
    },
  },
});
ongRegisterEn.options.ongTypes = {
  INDIVIDUAL: "Individual protector",
  INSTITUTION: "NGO / Institute / Association",
};
ongRegisterEn.options.ongTypeDescriptions = {
  INDIVIDUAL:
    "I work individually performing rescues, adoptions, care, foster homes and animal protection actions.",
  INSTITUTION:
    "I represent an organization, institute, association or entity focused on animal protection.",
};
ongRegisterEn.options.actionAreas = {
  RESCUE: "Animal rescue",
  ADOPTION: "Adoption",
  FOSTER: "Foster home",
  NEUTERING: "Spay/neuter",
  FEEDING: "Animal feeding",
  EDUCATION: "Animal education",
  AWARENESS: "Awareness",
  PROTECTION: "Animal protection",
  DEFENSE: "Animal defense",
  EMERGENCY: "Emergency care",
  CAMPAIGNS: "Solidarity campaigns",
  FUNDRAISING: "Fundraising",
  ADOPTION_FAIRS: "Adoption fairs",
  SHELTER: "Animal shelter",
  SOCIAL_VET: "Social veterinary hospital",
  OUTROS: "Other",
};
ongRegisterEn.options.representativeRoles = {
  PRESIDENT: "President",
  DIRECTOR: "Director",
  FOUNDER: "Founder",
  COORDINATOR: "Coordinator",
  LEGAL_REP: "Legal representative",
  OTHER: "Other",
};
ongRegisterEn.options.focusAreas = {
  PROTECTION: "Animal protection",
  RESCUE_ADOPTION: "Rescue and adoption",
  HEALTH: "Animal health",
  EDUCATION: "Education and awareness",
  RIGHTS: "Animal rights defense",
  OTHER: "Other",
};

const termsEn = {
  partner: {
    legalHeading: "EcoPet Partner Terms",
    legalSubheading:
      "Legal documents exclusive to partners — separate from EcoPet Customer terms.",
    termsPreview: partnerRegisterEn.documentation
      ? "These Terms govern EcoPet commercial partnership exclusively: registration, products, services, bookings, deliveries, pickup, animal transport, reputation, document verification, animal welfare and Partner responsibilities."
      : "",
    privacyPreview:
      "This Policy describes exclusively how EcoPet handles Partner data — CPF, CNPJ, contact, address, financial, documents, photos, logo, access and history — in compliance with applicable privacy laws.",
  },
  ong: {
    legalHeading: "EcoPet NGO Terms",
    legalSubheading:
      "Legal documents exclusive to NGOs and protectors — separate from EcoPet Customer terms.",
    termsPreview:
      "These Terms govern NGO and individual protector collaboration on EcoPet: rescue, responsible adoption, foster homes, campaigns, fundraising, adoption fairs, animal listings, ethical platform use, fraud and abuse prevention, plus registrant responsibilities and EcoPet limitations.",
    privacyPreview:
      "This Policy describes exclusively how EcoPet handles NGO and individual protector data — CPF, CNPJ, legal representative, contact, address, documents, proofs, photos, animal images, authentication, cookies and history — in compliance with applicable privacy laws.",
  },
};
termsEn.partner.termsPreview =
  "These Terms govern EcoPet commercial partnership exclusively: registration, products, services, bookings, deliveries, pickup, animal transport, reputation, document verification, animal welfare and Partner responsibilities.";

/** Spanish translations */
const partnerRegisterEs = JSON.parse(JSON.stringify(partnerRegisterEn));
partnerRegisterEs.typeHeading = "¿Cuál es su tipo de actuación?";
partnerRegisterEs.steps = {
  type: "Tipo",
  legal: "Representante",
  corporate: "Corporativo",
  professional: "Profesional",
  operation: "Funcionamiento",
  documentation: "Documentación",
  financial: "Financiero",
  security: "Seguridad",
};
partnerRegisterEs.sections = {
  legal: "Datos del representante legal",
  corporate: "Datos corporativos",
  professional: "Datos profesionales",
  operation: "Datos de funcionamiento",
  financial: "Datos financieros",
  security: "Seguridad",
  address: "Dirección completa",
};
partnerRegisterEs.fields.responsibleName = "Nombre completo del responsable";
partnerRegisterEs.fields.activityStart = "Fecha de inicio de actividades";
partnerRegisterEs.fields.businessName = "Nombre comercial";
partnerRegisterEs.fields.corporateType = "Tipo corporativo";
partnerRegisterEs.fields.corporateTypeOther = "Indique el tipo corporativo";
partnerRegisterEs.fields.professionalName = "Nombre comercial / profesional";
partnerRegisterEs.fields.activityArea = "Área de actuación";
partnerRegisterEs.fields.activityAreaSearch = "Buscar área...";
partnerRegisterEs.fields.activityAreaOther = "Describa su área de actuación";
partnerRegisterEs.fields.businessDescription = "Descripción del negocio";
partnerRegisterEs.legends.partnerType = "Tipo de socio *";
partnerRegisterEs.actions.continue = "Continuar";
partnerRegisterEs.actions.finish = "Finalizar registro";
partnerRegisterEs.actions.finishing = "Finalizando...";
partnerRegisterEs.actions.select = "Seleccione";
partnerRegisterEs.success.title = "Registro de socio completado con éxito.";
partnerRegisterEs.success.description =
  "Su cuenta está activa. Acceda al panel para configurar productos y servicios.";
partnerRegisterEs.validation.partnerTypeRequired =
  "Seleccione el tipo de socio para continuar.";
partnerRegisterEs.options.partnerTypes = {
  AUTONOMOUS: "Profesional autónomo",
  CORPORATE: "MEI / Empresa / Prestador de servicios",
};
partnerRegisterEs.options.partnerTypeDescriptions = {
  AUTONOMOUS: "Soy profesional independiente y actúo en nombre propio.",
  CORPORATE:
    "Tengo CNPJ, nombre comercial, razón social o presto servicios como persona jurídica.",
};
partnerRegisterEs.options.activityAreas = {
  SAUDE_ANIMAL: "Salud animal",
  ESTETICA_BEM_ESTAR: "Estética y bienestar",
  COMERCIO_PET: "Comercio pet",
  ALIMENTACAO: "Alimentación",
  HOSPEDAGEM_CRECHE: "Hospedaje y guardería",
  TREINAMENTO: "Entrenamiento y comportamiento",
  TRANSPORTE: "Transporte",
  REPRODUCAO: "Reproducción y genética",
  EVENTOS: "Eventos y ocio",
  SERVICOS_TECNICOS: "Servicios técnicos",
  EQUINOS: "Equinos",
  BOVINOS_AGRO: "Bovinos y agro",
  AQUARISMO: "Acuariofilia",
  EXOTICOS: "Animales exóticos",
  TECNOLOGIA: "Tecnología",
  EDUCACAO: "Educación",
  PROTECAO_ANIMAL: "Protección animal",
  OUTROS: "Otros",
};
partnerRegisterEs.documentation.title = "Documentación y verificación";
partnerRegisterEs.documentation.description =
  "Envíe los documentos obligatorios para completar el registro y, si lo desea, agregue documentos adicionales.";

const ongRegisterEs = JSON.parse(JSON.stringify(ongRegisterEn));
ongRegisterEs.typeHeading = "¿Cómo actúa en la protección animal?";
ongRegisterEs.steps = {
  type: "Tipo",
  responsible: "Responsable",
  responsibleInstitution: "Representante",
  institutional: "Institucional",
  activity: "Actuación",
  profile: "Perfil",
  documentation: "Documentación",
  security: "Seguridad",
};
ongRegisterEs.sections.responsible = "Responsable";
ongRegisterEs.sections.responsibleInstitution = "Representante legal";
ongRegisterEs.sections.institutional = "Datos institucionales";
ongRegisterEs.sections.activity = "Actuación";
ongRegisterEs.sections.profileIndividual = "Perfil de la causa";
ongRegisterEs.sections.profileInstitution = "Perfil institucional";
ongRegisterEs.validation.ongTypeRequired =
  "Seleccione cómo actúa en la protección animal.";
ongRegisterEs.options.ongTypes = {
  INDIVIDUAL: "Protector individual",
  INSTITUTION: "ONG / Instituto / Asociación",
};
ongRegisterEs.options.ongTypeDescriptions = {
  INDIVIDUAL:
    "Actúo individualmente realizando rescates, adopciones, cuidados, hogares temporales y acciones de protección animal.",
  INSTITUTION:
    "Represento una organización, instituto, asociación o entidad orientada a la protección animal.",
};
ongRegisterEs.success.title = "¡Cuenta creada con éxito!";
ongRegisterEs.success.description =
  "Su cuenta ONG está activa con acceso inmediato al panel.";
ongRegisterEs.documentation.title = "Documentación";

const termsEs = {
  partner: {
    legalHeading: "Términos del Socio EcoPet",
    legalSubheading:
      "Documentos jurídicos exclusivos para socios — independientes de los términos del Cliente EcoPet.",
    termsPreview:
      "Estos Términos regulan exclusivamente la asociación comercial en EcoPet: registro, productos, servicios, citas, entregas, recogida, transporte de animales, reputación, verificación documental, protección animal y responsabilidades del Socio.",
    privacyPreview:
      "Esta Política describe exclusivamente cómo EcoPet trata los datos de Socios — CPF, CNPJ, contacto, dirección, financiero, documentos, fotos, logotipo, acceso e historial — conforme a la legislación aplicable.",
  },
  ong: {
    legalHeading: "Términos de la ONG EcoPet",
    legalSubheading:
      "Documentos jurídicos exclusivos para ONGs y protectores — independientes de los términos del Cliente EcoPet.",
    termsPreview:
      "Estos Términos regulan exclusivamente la colaboración de ONGs y protectores individuales en EcoPet: rescate, adopción responsable, hogares temporales, campañas, recaudaciones, ferias de adopción, divulgación de animales, uso ético de la plataforma, combate al fraude y maltrato, además de las responsabilidades del registrado y limitaciones de EcoPet.",
    privacyPreview:
      "Esta Política describe exclusivamente cómo EcoPet trata los datos de ONGs y protectores individuales — CPF, CNPJ, representante legal, contacto, dirección, documentos, comprobantes, fotografías, imágenes de animales, autenticación, cookies e historial — conforme a la legislación aplicable.",
  },
};

const LOCALE_PATCHES = {
  "pt-BR.json": {
    register: { partner: partnerRegisterPt, ong: ongRegisterPt },
    terms: termsPt,
  },
  "en.json": {
    register: { partner: partnerRegisterEn, ong: ongRegisterEn },
    terms: termsEn,
  },
  "es.json": {
    register: { partner: partnerRegisterEs, ong: ongRegisterEs },
    terms: termsEs,
  },
};

for (const [file, patch] of Object.entries(LOCALE_PATCHES)) {
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  data.auth.register = deepMerge(data.auth.register ?? {}, patch.register);
  data.auth.terms = deepMerge(data.auth.terms ?? {}, patch.terms);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`✓ Patched ${file}`);
}

console.log("Done — auth.register.partner/ong and auth.terms.partner/ong updated.");
