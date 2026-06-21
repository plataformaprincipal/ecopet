import { FoundationForgotPasswordForm } from "@/components/features/foundation/forgot-password-form";

export default function RecuperarSenhaPage() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-b from-emerald-50/80 via-gray-50 to-white px-4 py-10 dark:from-ecopet-dark-bg dark:via-ecopet-dark-bg dark:to-black/20 sm:items-center sm:py-16">
      <FoundationForgotPasswordForm />
    </main>
  );
}
