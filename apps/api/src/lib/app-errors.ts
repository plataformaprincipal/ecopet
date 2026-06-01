export const USER_MESSAGES = {
  EMAIL_DUPLICATE: "Este e-mail já está cadastrado. Faça login ou recupere sua senha.",
  CPF_DUPLICATE: "Este CPF já está cadastrado na ECOPET. Tente fazer login ou recuperar sua senha.",
  CPF_DUPLICATE_SHORT: "Este CPF já está cadastrado. Verifique seus dados ou recupere o acesso.",
  CNPJ_DUPLICATE: "Este CNPJ já está cadastrado na ECOPET. Acesse sua conta ou solicite recuperação de senha.",
  CNPJ_DUPLICATE_SHORT: "Este CNPJ já está cadastrado. Acesse a conta da organização ou solicite suporte.",
  DOCUMENT_DUPLICATE: "Este documento já está vinculado a uma conta na ECOPET.",
  PHONE_DUPLICATE: "Este telefone já está vinculado a uma conta.",
  USER_NOT_FOUND: "Usuário não cadastrado. Verifique os dados informados ou crie uma conta.",
  USER_OR_PASSWORD_INCORRECT: "Usuário ou senha incorretos.",
  ACCOUNT_UNAVAILABLE: (reason: string) =>
    `Sua conta existe, mas o acesso está temporariamente indisponível. Motivo: ${reason}. Entre em contato com o suporte da ECOPET.`,
  VALIDATION: "Alguns campos precisam ser corrigidos antes de continuar.",
  CONNECTION: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
  DATABASE: "Não foi possível salvar seus dados agora. Tente novamente em instantes.",
  PERMISSION: "Você não tem permissão para acessar esta área.",
  SESSION: "Sua sessão expirou. Faça login novamente.",
  UNEXPECTED: "Ocorreu um erro inesperado. Tente novamente. Se persistir, entre em contato com o suporte.",
  ADMIN_REGISTER_FORBIDDEN: "Cadastro de equipe interna não está disponível nesta página. Solicite acesso ao Gestor ECOPET.",
  BIRTH_DATE_FUTURE: "A data de nascimento não pode ser futura. Informe uma data válida.",
  CPF_INVALID: "CPF inválido. Verifique os números informados.",
  CNPJ_INVALID: "CNPJ inválido. Verifique os números informados.",
} as const;

export const ACCOUNT_REASON_LABELS: Record<string, string> = {
  pending_approval: "conta pendente de aprovação",
  suspended: "conta suspensa",
  documents_pending: "documentos pendentes",
  access_revoked: "acesso revogado",
  insufficient_permissions: "permissões insuficientes",
  email_not_verified: "e-mail não verificado",
  rejected: "cadastro não aprovado",
  account_locked: "conta temporariamente bloqueada por tentativas inválidas",
};

export class AppError extends Error {
  code?: string;
  status: number;
  userMessage: string;
  metadata?: Record<string, unknown>;

  constructor(userMessage: string, status = 400, code?: string, metadata?: Record<string, unknown>) {
    super(userMessage);
    this.userMessage = userMessage;
    this.status = status;
    this.code = code;
    this.metadata = metadata;
  }
}

export function accountUnavailableMessage(reasonKey?: string | null, accountStatus?: string): string {
  const key = reasonKey ?? (accountStatus === "PENDING" ? "pending_approval" : accountStatus === "SUSPENDED" ? "suspended" : accountStatus === "REJECTED" ? "rejected" : "access_revoked");
  const label = ACCOUNT_REASON_LABELS[key] ?? "acesso restrito";
  return USER_MESSAGES.ACCOUNT_UNAVAILABLE(label);
}
