import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Development-only: accept any non-empty credentials.
        if (!credentials?.username || !credentials?.password) return null;
        return { id: `user-${credentials.username}`, name: credentials.username } as any;
      },
    }),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  // Configure pages if you want custom UI later
  // pages: { signIn: "/auth/signin" },
  secret: process.env.NEXTAUTH_SECRET,
};
