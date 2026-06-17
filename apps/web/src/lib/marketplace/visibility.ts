import { AccountStatus, Prisma } from "@prisma/client";

/** Parceiros com acesso ao marketplace (ignora PENDING legado; bloqueia apenas suspensos/rejeitados). */
export const activePartnerUserWhere: Prisma.UserWhereInput = {
  role: "PARTNER",
  accountStatus: { notIn: [AccountStatus.SUSPENDED, AccountStatus.REJECTED] },
};
