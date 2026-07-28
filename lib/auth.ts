// Note: next-auth is currently pinned to 5.0.0-beta.30 in package.json to prevent breaking changes.
// This should move to a stable v5 release once one exists.
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (user && user.password && await compare(credentials.password as string, user.password)) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
          return null;
        } catch (error) {
          console.error("Authentication Error:", error);
          throw error;
        }
      },
    }),
  ],
});
