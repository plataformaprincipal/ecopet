import NextAuth from "next-auth";
import { env } from "@/lib/env";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerApiUrl } from "@/lib/api-url.server";

const API_URL = getServerApiUrl();

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "E-mail ou usuário", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            image: data.user.avatar,
            apiToken: data.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.apiToken = (user as { apiToken?: string }).apiToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session as { apiToken?: string }).apiToken = token.apiToken as string;
      }
      return session;
    },
  },
  secret: env.nextAuthSecret,
});

export { handler as GET, handler as POST };
