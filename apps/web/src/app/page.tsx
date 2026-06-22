import { PublicClientShell } from "@/components/features/public-client/public-client-shell";
import { PublicHomePage } from "@/components/features/public-client/pages/public-home-page";

export default function HomePage() {
  return (
    <PublicClientShell>
      <PublicHomePage />
    </PublicClientShell>
  );
}
