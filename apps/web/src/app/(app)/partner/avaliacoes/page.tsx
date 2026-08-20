import { prisma } from "@/lib/prisma";
import { guardPartner } from "@/lib/auth/guards";

export default async function PartnerReviewsPage() {
  const user = await guardPartner("/partner/avaliacoes");

  const [productReviews, serviceReviews] = await Promise.all([
    prisma.review.findMany({
      where: { product: { sellerId: user.id }, moderationStatus: "VISIBLE" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        product: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.serviceReview.findMany({
      where: { partnerId: user.id, moderationStatus: "VISIBLE" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        service: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const rows = [
    ...productReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      subject: r.product.name,
      author: r.user.name,
      kind: "Produto",
    })),
    ...serviceReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      subject: r.service.name,
      author: r.user.name,
      kind: "Serviço",
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 lg:p-8" data-testid="partner-reviews">
      <h1 className="font-display text-2xl font-semibold">Avaliações</h1>
      <p className="text-sm text-muted-foreground">
        Notas reais de clientes sobre os seus produtos e serviços. Não há ranking fictício.
      </p>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          Nenhuma avaliação visível ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border p-4 text-sm">
              <p className="font-medium">
                {row.kind} · {row.subject} · {row.rating}/5
              </p>
              <p className="text-muted-foreground">{row.author}</p>
              {row.comment ? <p className="mt-2">{row.comment}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
