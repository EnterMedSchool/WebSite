import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import request from '../../../request';
export default NextAuth({
  // Configure one or more authentication providers
  callbacks: {
    async signIn({ profile }) {
      const body = {
        googleId: profile.sub,
        name: profile.name,
        username: profile.sub,
        photo: profile.picture,
        email: profile.email,
      };

      await request.post('/users/auth', body);

      return true; // Do different verification for other providers that don't have `email_verified`
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.jwtToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.jwt = token.jwtToken;
      return session;
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});
