import { UserRole } from "@prisma/client";
import { guardRole } from "@/lib/auth/guards";

export default async function ClinicaLayout({ children }: { children: React.ReactNode }) {
  await guardRole([UserRole.CLINIC, UserRole.VETERINARIAN, UserRole.PARTNER], "/clinica");
  return <>{children}</>;
}
