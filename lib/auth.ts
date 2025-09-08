import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = (creds?.email || "").toLowerCase().trim();
        const password = creds?.password || "";
        if (!email || !password) return null;
        const rows = await db.select().from(users).where(eq(users.email as any, email));
        const user = rows[0];
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: String(user.id), name: user.name ?? user.username, email: user.email ?? undefined, image: user.image ?? undefined } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // On initial sign in with Google, upsert user in DB
      if (account?.provider === "google" && profile) {
        const email = (profile.email as string | undefined)?.toLowerCase();
        if (email) {
          const existing = (await db.select().from(users).where(eq(users.email as any, email)))[0];
          if (!existing) {
              const username = (email.split("@")[0] || "user").slice(0, 80);
              try {
                const inserted = await db.insert(users).values({
                  username,
                  name: (profile as any)?.name || (profile as any)?.given_name || username,
                  email,
                  image: ((profile as any)?.picture as string) || ((profile as any)?.image as string) || null,
                }).returning({ id: users.id });
                token.userId = String(inserted[0].id);
              } catch {
                const fallback = (await db.select().from(users).where(eq(users.email as any, email)))[0];
                if (fallback) token.userId = String(fallback.id);
            }
          } else {
            token.userId = String(existing.id);
          }
        }
      }
      if (user && (user as any).id) {
        token.userId = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) (session as any).userId = token.userId;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// In NextAuth v4, prefer getServerSession(authOptions) inside Route Handlers and Server Components.
// Export a thin wrapper with a stable name used across this codebase.
export async function authGetServerSession() {
  return await getServerSession(authOptions);
}

// Keep route handler export (used by app/api/auth/[...nextauth]/route.ts)
export const authHandlers = NextAuth(authOptions);
