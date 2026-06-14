import { Suspense } from "react";
import { FoundationLoginForm } from "@/components/foundation/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <Suspense>
        <FoundationLoginForm />
      </Suspense>
    </main>
  );
}
