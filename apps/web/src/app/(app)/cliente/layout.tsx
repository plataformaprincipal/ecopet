import { UserRole } from "@prisma/client";
import { ClientShell } from "@/components/features/client/client-shell";
import { guardRole } from "@/lib/auth/guards";

export default async function ClientAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await guardRole([UserRole.CLIENT], "/cliente");

  return <ClientShell userName={user.name}>{children}</ClientShell>;
}
