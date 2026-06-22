"use client";

import { useRouter } from "next/navigation";
import { loginUrl, signupUrl } from "@/lib/public-client/nav";

type ClientProtectedActionProps = {
  isAuthenticated: boolean;
  callbackPath: string;
  children: React.ReactNode;
  className?: string;
};

/** Wrapper: redireciona visitantes para login ao interagir */
export function ClientProtectedAction({
  isAuthenticated,
  callbackPath,
  children,
  className,
}: ClientProtectedActionProps) {
  const router = useRouter();

  if (isAuthenticated) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => router.push(loginUrl(callbackPath))}
    >
      {children}
    </button>
  );
}

export function redirectToLogin(callbackPath: string) {
  if (typeof window !== "undefined") {
    window.location.href = loginUrl(callbackPath);
  }
}

export function redirectToSignup(callbackPath: string) {
  if (typeof window !== "undefined") {
    window.location.href = signupUrl(callbackPath);
  }
}
