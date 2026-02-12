import { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [GitHub, Google],
  pages: {
    signIn: '/signin'
  },
  callbacks: {
    async signIn({ user }) {
      return true;
    },
    async session({ session, user }) {
      return session;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;
