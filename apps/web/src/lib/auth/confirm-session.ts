/** Confirma que o cookie ecopet-session foi gravado e é legível pelo servidor. */
export async function confirmSessionCookie(): Promise<boolean> {
  const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
  if (!res.ok) return false;
  const data = await res.json();
  return data?.success !== false && !!data?.data?.user;
}
