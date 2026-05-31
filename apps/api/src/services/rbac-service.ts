import { prisma } from "@ecopet/database";

const GESTOR_ROLES = new Set(["GESTOR", "ADMIN"]);

export async function userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === "ADMIN") return true;

  const assignment = await prisma.userRbacAssignment.findFirst({
    where: {
      userId,
      role: {
        permissions: {
          some: { permission: { code: permissionCode } },
        },
      },
    },
  });
  return !!assignment;
}

export async function userHasAnyPermission(userId: string, codes: string[]): Promise<boolean> {
  for (const code of codes) {
    if (await userHasPermission(userId, code)) return true;
  }
  return false;
}

export function isGestorRole(role?: string) {
  return role ? GESTOR_ROLES.has(role) : false;
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === "ADMIN") {
    const all = await prisma.permission.findMany({ select: { code: true } });
    return all.map((p) => p.code);
  }

  const assignments = await prisma.userRbacAssignment.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  const codes = new Set<string>();
  for (const a of assignments) {
    for (const rp of a.role.permissions) {
      codes.add(rp.permission.code);
    }
  }
  return [...codes];
}

export async function listRbacRoles() {
  return prisma.rbacRole.findMany({
    include: {
      department: true,
      permissions: { include: { permission: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { hierarchyLevel: "desc" },
  });
}

export async function listDepartments() {
  return prisma.department.findMany({ orderBy: { name: "asc" } });
}
