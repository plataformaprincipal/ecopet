import { Suspense } from "react";
import { PublicAdoptionGallery } from "@/components/features/public/ngo/public-adoption-gallery";

/**
 * /adocao — experiência pública de adoção.
 * Reutiliza a galeria alimentada por /api/public/adoption com filtros na query string.
 */
export default function AdocaoPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-white/5" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/5" />
            ))}
          </div>
        </main>
      }
    >
      <PublicAdoptionGallery />
    </Suspense>
  );
}
