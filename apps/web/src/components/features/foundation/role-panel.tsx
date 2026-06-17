import type { SafeUser } from "@/lib/auth";
import { formatUserRole } from "@/lib/auth/format-user-role";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/shared/auth/logout-button";

interface FoundationRolePanelProps {
  user: SafeUser;
  title: string;
  description: string;
}

export function FoundationRolePanel({ user, title, description }: FoundationRolePanelProps) {
  const statusLabel =
    user.accountStatus === "PENDING"
      ? "Pendente de aprovação"
      : user.accountStatus === "SUSPENDED"
        ? "Suspensa"
        : user.accountStatus === "REJECTED"
          ? "Rejeitada"
          : "Ativa";

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Usuário:</strong> {user.name}
            </p>
            <p>
              <strong>E-mail:</strong> {user.email}
            </p>
            <p>
              <strong>Perfil:</strong> {formatUserRole(user.role)}
            </p>
            <p>
              <strong>Status da conta:</strong> {statusLabel}
            </p>
            {user.partnerProfile && (
              <p>
                <strong>Parceiro:</strong> {user.partnerProfile.businessName}
              </p>
            )}
            {user.ongProfile && (
              <p>
                <strong>ONG:</strong> {user.ongProfile.ongName}
              </p>
            )}
            <p className="text-muted-foreground pt-2">
              Os módulos deste painel serão implementados nas próximas etapas de desenvolvimento.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="default">
                <Link href={
                  user.role === "CLIENT"
                    ? "/dashboard/client/profile"
                    : user.role === "PARTNER"
                      ? "/dashboard/partner/profile"
                      : user.role === "ONG"
                        ? "/dashboard/ong/profile"
                        : "/perfil"
                }>Meu perfil</Link>
              </Button>
              {user.role === "CLIENT" && (
                <>
                  <Button asChild variant="outline"><Link href="/dashboard/client/pets">Meus pets</Link></Button>
                  <Button asChild variant="outline"><Link href="/servicos">Serviços</Link></Button>
                  <Button asChild variant="outline"><Link href="/produtos">Produtos</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/client/appointments">Agendamentos</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/client/orders">Pedidos</Link></Button>
                  <Button asChild variant="outline"><Link href="/carrinho">Carrinho</Link></Button>
                </>
              )}
              {user.role === "PARTNER" && user.accountStatus !== "SUSPENDED" && user.accountStatus !== "REJECTED" && (
                <>
                  <Button asChild variant="outline"><Link href="/dashboard/partner/services">Serviços</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/partner/products">Produtos</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/partner/inventory">Estoque</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/partner/orders">Pedidos</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/partner/availability">Disponibilidade</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/partner/appointments">Agendamentos</Link></Button>
                </>
              )}
              {user.role === "ADMIN" && (
                <>
                  <Button asChild variant="outline"><Link href="/dashboard/admin/accounts">Contas</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/admin/products">Produtos</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/admin/orders">Pedidos</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/admin/reviews">Avaliações</Link></Button>
                  <Button asChild variant="outline"><Link href="/dashboard/admin/audit-logs">Auditoria</Link></Button>
                </>
              )}
              <Button asChild variant="outline">
                <Link href="/configuracoes">Configurações</Link>
              </Button>
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
