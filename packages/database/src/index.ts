export { PrismaClient } from "@prisma/client";
export {
  UserRole,
  AccountStatus,
  VerificationStatus,
  EmailStatus,
  PetSpecies,
  PetSize,
  PostType,
  OrderStatus,
  SubscriptionPlan,
  BadgeType,
  AdoptionStatus,
  AppointmentServiceType,
  AppointmentAttendanceMode,
  AppointmentStatus,
  ConversationType,
  TicketPriority,
  TicketStatus,
  ReadyServiceCategory,
  CustomRequestUrgency,
} from "@prisma/client";
export type * from "@prisma/client";

export { prisma, createPrismaClient, getResolvedDatabaseUrl } from "./client";
export {
  buildDatabaseBootDiagnostics,
  extractPrismaConnectError,
  logDatabaseBootDiagnostics,
  logPrismaConnectFailure,
  parseDatabaseUrlHost,
  type DatabaseBootDiagnostics,
  type PrismaConnectErrorDetails,
} from "./diagnostics";
export * from "./repositories/index";
