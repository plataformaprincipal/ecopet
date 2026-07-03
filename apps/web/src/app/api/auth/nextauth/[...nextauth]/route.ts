/**
 * NextAuth isolado para OAuth futuro — NÃO usado pela sessão principal (ecopet-session).
 * Base path próprio evita conflito com /api/auth/session e /api/auth/login.
 */
import NextAuth from "next-auth";
import { resolveAuthSecret } from "@/lib/auth-secret";

const handler = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: resolveAuthSecret(),
});

export { handler as GET, handler as POST };
