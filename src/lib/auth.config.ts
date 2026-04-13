import { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

const authSecrets = [
  process.env.AUTH_SECRET,
  process.env.NEXTAUTH_SECRET,
  process.env.BETTER_AUTH_SECRET
].filter((secret): secret is string => Boolean(secret));

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  secret: authSecrets.length <= 1 ? authSecrets[0] : authSecrets,
  trustHost: true,
  providers: [GitHub, Google],
  pages: {
    signIn: '/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      return session;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;
