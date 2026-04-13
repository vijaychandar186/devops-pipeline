import { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

const authSecrets = [
  process.env.AUTH_SECRET,
  process.env.NEXTAUTH_SECRET,
  process.env.BETTER_AUTH_SECRET
].filter((secret): secret is string => Boolean(secret));

export const authEdgeConfig = {
  secret: authSecrets.length <= 1 ? authSecrets[0] : authSecrets,
  providers: [GitHub, Google],
  pages: {
    signIn: '/signin'
  }
} satisfies NextAuthConfig;

export default authEdgeConfig;
