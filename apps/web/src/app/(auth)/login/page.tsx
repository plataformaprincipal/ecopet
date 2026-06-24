import { Suspense } from "react";
import { PremiumLoginExperience } from "@/components/features/auth/premium-login-experience";

export default function LoginPage() {
  return (
    <Suspense>
      <PremiumLoginExperience />
    </Suspense>
  );
}
