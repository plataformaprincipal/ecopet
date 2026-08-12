import { PublicAdoptionGallery } from "@/components/features/public/ngo/public-adoption-gallery";

/**
 * /adocao — experiência pública de adoção (sem mensagens de infraestrutura).
 * Reutiliza a galeria alimentada por /api/public/adoption.
 */
export default function AdocaoPage() {
  return <PublicAdoptionGallery />;
}
