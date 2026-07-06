import { prisma } from "../client";
import type { Prisma, User, UserRole } from "@prisma/client";

export const userRepository = {
  findById(id: string, select?: Prisma.UserSelect) {
    return prisma.user.findUnique({ where: { id }, select });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },

  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  findByRole(role: UserRole, take = 50) {
    return prisma.user.findMany({ where: { role }, take, orderBy: { createdAt: "desc" } });
  },
};
