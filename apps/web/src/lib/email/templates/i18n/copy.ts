import type { EmailLocale } from "@/lib/email/templates/locale";
import { BRAND } from "@/lib/constants";

export interface EmailCommonCopy {
  brandName: string;
  autoEmail: string;
  footerTagline: string;
  rights: string;
  support: string;
  aiDisclaimerPt: string;
  aiDisclaimerEn: string;
  aiDisclaimerEs: string;
  aiSectionTitle: string;
}

export interface PasswordRecoveryCopy {
  subject: string;
  preview: (name: string) => string;
  title: string;
  greeting: (name: string) => string;
  message: string;
  otpLabel: string;
  validity: string;
  button: string;
  ignore: string;
}

export interface OtpCodeCopy {
  subject: string;
  preview: string;
  title: string;
  message: string;
  otpLabel: string;
  validity: string;
  ignore: string;
}

export interface WelcomeCopy {
  subject: string;
  preview: (name: string) => string;
  title: string;
  greeting: (name: string) => string;
  message: string;
  accountType: string;
  dashboardAccess: string;
  button: string;
}

export interface RegistrationCompletedCopy extends WelcomeCopy {
  subject: string;
}

export interface PasswordChangedCopy {
  subject: string;
  preview: string;
  title: string;
  message: string;
  securityTip: string;
  button: string;
}

export interface OrderPlacedCopy {
  subject: (orderNumber: number) => string;
  preview: (orderNumber: number) => string;
  title: string;
  greeting: (name: string) => string;
  message: (orderNumber: number) => string;
  button: string;
}

export interface AppointmentScheduledCopy {
  subject: string;
  preview: string;
  title: string;
  greeting: (name: string) => string;
  message: (serviceName: string) => string;
  button: string;
}

export interface NotificationCopy {
  subject: (title: string) => string;
  preview: (title: string) => string;
  defaultTitle: string;
  button: string;
}

export interface EmailCopyBundle {
  common: EmailCommonCopy;
  passwordRecovery: PasswordRecoveryCopy;
  otpCode: OtpCodeCopy;
  welcome: WelcomeCopy;
  registrationCompleted: RegistrationCompletedCopy;
  passwordChanged: PasswordChangedCopy;
  orderPlaced: OrderPlacedCopy;
  appointmentScheduled: AppointmentScheduledCopy;
  notification: NotificationCopy;
  roles: Record<string, string>;
}

const AI_PT =
  "A IA EccoPet não substitui médicos-veterinários, zootecnistas, adestradores, especialistas ou outros profissionais qualificados. As informações fornecidas possuem caráter informativo e de apoio à tomada de decisão.";
const AI_EN =
  "EccoPet AI does not replace veterinarians, animal scientists, trainers, specialists, or other qualified professionals. The information provided is for informational and decision-support purposes only.";
const AI_ES =
  "La IA de EccoPet no sustituye a veterinarios, zootecnistas, adiestradores, especialistas u otros profesionales calificados. La información proporcionada tiene carácter informativo y de apoyo a la toma de decisiones.";

const PT_BR: EmailCopyBundle = {
  common: {
    brandName: BRAND.name,
    autoEmail: "Este é um e-mail automático. Não responda diretamente.",
    footerTagline: "Ecossistema pet inteligente",
    rights: "© EccoPet. Todos os direitos reservados.",
    support: "suporte@ecopet.com.br",
    aiDisclaimerPt: AI_PT,
    aiDisclaimerEn: AI_EN,
    aiDisclaimerEs: AI_ES,
    aiSectionTitle: "Aviso sobre IA",
  },
  passwordRecovery: {
    subject: "Recuperação de Senha — EccoPet",
    preview: (name) => `Redefina sua senha EccoPet, ${name}`,
    title: "Recuperação de Senha",
    greeting: (name) => `Olá, ${name}`,
    message: "Recebemos uma solicitação para redefinir a senha da sua conta EccoPet.",
    otpLabel: "Seu código de verificação",
    validity: "Válido por 10 minutos.",
    button: "Redefinir Senha",
    ignore: "Se você não solicitou, ignore este e-mail.",
  },
  otpCode: {
    subject: "Código de verificação — EccoPet",
    preview: "Seu código de verificação EccoPet",
    title: "Código de Verificação",
    message: "Use o código abaixo para concluir sua verificação:",
    otpLabel: "Código",
    validity: "Válido por 10 minutos.",
    ignore: "Se você não solicitou, ignore este e-mail.",
  },
  welcome: {
    subject: "Bem-vindo(a) à EccoPet",
    preview: (name) => `Bem-vindo(a) à EccoPet, ${name}!`,
    title: "Bem-vindo(a) à EccoPet",
    greeting: (name) => `Olá, ${name}!`,
    message: "Sua conta foi criada com sucesso.",
    accountType: "Tipo de conta",
    dashboardAccess: "Você já pode acessar seu painel e explorar o ecossistema EccoPet.",
    button: "Acessar EccoPet",
  },
  registrationCompleted: {
    subject: "Cadastro concluído — EccoPet",
    preview: (name) => `Cadastro concluído, ${name}!`,
    title: "Cadastro Concluído",
    greeting: (name) => `Olá, ${name}!`,
    message: "Sua conta foi criada com sucesso.",
    accountType: "Tipo de conta",
    dashboardAccess: "Acesse seu painel para começar.",
    button: "Acessar EccoPet",
  },
  passwordChanged: {
    subject: "Senha alterada — EccoPet",
    preview: "Sua senha EccoPet foi alterada",
    title: "Senha Alterada",
    message: "A senha da sua conta EccoPet foi alterada com sucesso.",
    securityTip: "Se você não realizou esta alteração, entre em contato conosco imediatamente.",
    button: "Acessar EccoPet",
  },
  orderPlaced: {
    subject: (n) => `Pedido #${n} realizado — EccoPet`,
    preview: (n) => `Seu pedido #${n} foi registrado`,
    title: "Pedido Realizado",
    greeting: (name) => `Olá, ${name}!`,
    message: (n) => `Seu pedido #${n} foi registrado com sucesso.`,
    button: "Ver Pedido",
  },
  appointmentScheduled: {
    subject: "Agendamento realizado — EccoPet",
    preview: "Seu agendamento foi registrado",
    title: "Agendamento Realizado",
    greeting: (name) => `Olá, ${name}!`,
    message: (service) => `Seu agendamento para ${service} foi registrado com sucesso.`,
    button: "Ver Agenda",
  },
  notification: {
    subject: (title) => `${title} — EccoPet`,
    preview: (title) => title,
    defaultTitle: "Notificação EccoPet",
    button: "Abrir EccoPet",
  },
  roles: {
    CLIENT: "Cliente",
    TUTOR: "Tutor",
    VETERINARIAN: "Veterinário(a)",
    CLINIC: "Clínica",
    PETSHOP: "Pet Shop",
    SELLER: "Vendedor(a)",
    SERVICE_PROVIDER: "Prestador(a) de serviços",
    ONG: "ONG",
    ADMIN: "Administrador(a)",
    GESTOR: "Gestor(a)",
    PARTNER: "Parceiro(a)",
    DELIVERY: "Entregador(a)",
    INFLUENCER: "Influenciador(a)",
  },
};

const EN: EmailCopyBundle = {
  common: {
    brandName: BRAND.name,
    autoEmail: "This is an automated email. Please do not reply directly.",
    footerTagline: "Intelligent pet ecosystem",
    rights: "© EccoPet. All rights reserved.",
    support: "suporte@ecopet.com.br",
    aiDisclaimerPt: AI_PT,
    aiDisclaimerEn: AI_EN,
    aiDisclaimerEs: AI_ES,
    aiSectionTitle: "AI notice",
  },
  passwordRecovery: {
    subject: "Password Recovery — EccoPet",
    preview: (name) => `Reset your EccoPet password, ${name}`,
    title: "Password Recovery",
    greeting: (name) => `Hello, ${name}`,
    message: "We received a request to reset the password for your EccoPet account.",
    otpLabel: "Your verification code",
    validity: "Valid for 10 minutes.",
    button: "Reset Password",
    ignore: "If you did not request this, please ignore this email.",
  },
  otpCode: {
    subject: "Verification code — EccoPet",
    preview: "Your EccoPet verification code",
    title: "Verification Code",
    message: "Use the code below to complete your verification:",
    otpLabel: "Code",
    validity: "Valid for 10 minutes.",
    ignore: "If you did not request this, please ignore this email.",
  },
  welcome: {
    subject: "Welcome to EccoPet",
    preview: (name) => `Welcome to EccoPet, ${name}!`,
    title: "Welcome to EccoPet",
    greeting: (name) => `Hello, ${name}!`,
    message: "Your account was created successfully.",
    accountType: "Account type",
    dashboardAccess: "You can now access your dashboard and explore the EccoPet ecosystem.",
    button: "Access EccoPet",
  },
  registrationCompleted: {
    subject: "Registration completed — EccoPet",
    preview: (name) => `Registration completed, ${name}!`,
    title: "Registration Completed",
    greeting: (name) => `Hello, ${name}!`,
    message: "Your account was created successfully.",
    accountType: "Account type",
    dashboardAccess: "Access your dashboard to get started.",
    button: "Access EccoPet",
  },
  passwordChanged: {
    subject: "Password changed — EccoPet",
    preview: "Your EccoPet password was changed",
    title: "Password Changed",
    message: "Your EccoPet account password was changed successfully.",
    securityTip: "If you did not make this change, contact us immediately.",
    button: "Access EccoPet",
  },
  orderPlaced: {
    subject: (n) => `Order #${n} placed — EccoPet`,
    preview: (n) => `Your order #${n} was registered`,
    title: "Order Placed",
    greeting: (name) => `Hello, ${name}!`,
    message: (n) => `Your order #${n} was registered successfully.`,
    button: "View Order",
  },
  appointmentScheduled: {
    subject: "Appointment scheduled — EccoPet",
    preview: "Your appointment was registered",
    title: "Appointment Scheduled",
    greeting: (name) => `Hello, ${name}!`,
    message: (service) => `Your appointment for ${service} was registered successfully.`,
    button: "View Schedule",
  },
  notification: {
    subject: (title) => `${title} — EccoPet`,
    preview: (title) => title,
    defaultTitle: "EccoPet Notification",
    button: "Open EccoPet",
  },
  roles: {
    CLIENT: "Client",
    TUTOR: "Pet owner",
    VETERINARIAN: "Veterinarian",
    CLINIC: "Clinic",
    PETSHOP: "Pet shop",
    SELLER: "Seller",
    SERVICE_PROVIDER: "Service provider",
    ONG: "NGO",
    ADMIN: "Administrator",
    GESTOR: "Manager",
    PARTNER: "Partner",
    DELIVERY: "Delivery",
    INFLUENCER: "Influencer",
  },
};

const ES: EmailCopyBundle = {
  common: {
    brandName: BRAND.name,
    autoEmail: "Este es un correo automático. No responda directamente.",
    footerTagline: "Ecosistema pet inteligente",
    rights: "© EccoPet. Todos los derechos reservados.",
    support: "suporte@ecopet.com.br",
    aiDisclaimerPt: AI_PT,
    aiDisclaimerEn: AI_EN,
    aiDisclaimerEs: AI_ES,
    aiSectionTitle: "Aviso sobre IA",
  },
  passwordRecovery: {
    subject: "Recuperación de Contraseña — EccoPet",
    preview: (name) => `Restablece tu contraseña EccoPet, ${name}`,
    title: "Recuperación de Contraseña",
    greeting: (name) => `Hola, ${name}`,
    message: "Recibimos una solicitud para restablecer la contraseña de tu cuenta EccoPet.",
    otpLabel: "Tu código de verificación",
    validity: "Válido por 10 minutos.",
    button: "Restablecer Contraseña",
    ignore: "Si no solicitaste esto, ignora este correo.",
  },
  otpCode: {
    subject: "Código de verificación — EccoPet",
    preview: "Tu código de verificación EccoPet",
    title: "Código de Verificación",
    message: "Usa el código a continuación para completar tu verificación:",
    otpLabel: "Código",
    validity: "Válido por 10 minutos.",
    ignore: "Si no solicitaste esto, ignora este correo.",
  },
  welcome: {
    subject: "Bienvenido(a) a EccoPet",
    preview: (name) => `¡Bienvenido(a) a EccoPet, ${name}!`,
    title: "Bienvenido(a) a EccoPet",
    greeting: (name) => `¡Hola, ${name}!`,
    message: "Tu cuenta fue creada con éxito.",
    accountType: "Tipo de cuenta",
    dashboardAccess: "Ya puedes acceder a tu panel y explorar el ecosistema EccoPet.",
    button: "Acceder a EccoPet",
  },
  registrationCompleted: {
    subject: "Registro completado — EccoPet",
    preview: (name) => `Registro completado, ${name}!`,
    title: "Registro Completado",
    greeting: (name) => `¡Hola, ${name}!`,
    message: "Tu cuenta fue creada con éxito.",
    accountType: "Tipo de cuenta",
    dashboardAccess: "Accede a tu panel para comenzar.",
    button: "Acceder a EccoPet",
  },
  passwordChanged: {
    subject: "Contraseña cambiada — EccoPet",
    preview: "Tu contraseña EccoPet fue cambiada",
    title: "Contraseña Cambiada",
    message: "La contraseña de tu cuenta EccoPet fue cambiada con éxito.",
    securityTip: "Si no realizaste este cambio, contáctanos de inmediato.",
    button: "Acceder a EccoPet",
  },
  orderPlaced: {
    subject: (n) => `Pedido #${n} realizado — EccoPet`,
    preview: (n) => `Tu pedido #${n} fue registrado`,
    title: "Pedido Realizado",
    greeting: (name) => `¡Hola, ${name}!`,
    message: (n) => `Tu pedido #${n} fue registrado con éxito.`,
    button: "Ver Pedido",
  },
  appointmentScheduled: {
    subject: "Cita agendada — EccoPet",
    preview: "Tu cita fue registrada",
    title: "Cita Agendada",
    greeting: (name) => `¡Hola, ${name}!`,
    message: (service) => `Tu cita para ${service} fue registrada con éxito.`,
    button: "Ver Agenda",
  },
  notification: {
    subject: (title) => `${title} — EccoPet`,
    preview: (title) => title,
    defaultTitle: "Notificación EccoPet",
    button: "Abrir EccoPet",
  },
  roles: {
    CLIENT: "Cliente",
    TUTOR: "Tutor",
    VETERINARIAN: "Veterinario(a)",
    CLINIC: "Clínica",
    PETSHOP: "Pet Shop",
    SELLER: "Vendedor(a)",
    SERVICE_PROVIDER: "Proveedor(a) de servicios",
    ONG: "ONG",
    ADMIN: "Administrador(a)",
    GESTOR: "Gestor(a)",
    PARTNER: "Socio(a)",
    DELIVERY: "Repartidor(a)",
    INFLUENCER: "Influencer",
  },
};

const BUNDLES: Record<EmailLocale, EmailCopyBundle> = {
  "pt-BR": PT_BR,
  en: EN,
  es: ES,
};

export function getEmailCopy(locale: EmailLocale): EmailCopyBundle {
  return BUNDLES[locale] ?? BUNDLES["pt-BR"];
}

export function roleLabel(locale: EmailLocale, role: string): string {
  const copy = getEmailCopy(locale);
  return copy.roles[role] ?? role;
}
