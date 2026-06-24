import { PublicClientShell } from "@/components/features/public-client/public-client-shell";
import { PremiumPublicHome } from "@/components/features/public-premium/premium-public-home";

export default function HomePage() {
  return (
    <PublicClientShell>
      <PremiumPublicHome />
    </PublicClientShell>
  );
}
