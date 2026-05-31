import { AgroShell } from "@/components/agro/agro-shell";

export default function AgroLayout({ children }: { children: React.ReactNode }) {
  return <AgroShell>{children}</AgroShell>;
}
