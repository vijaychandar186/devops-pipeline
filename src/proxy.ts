import NextAuth from 'next-auth';
import { authEdgeConfig } from '@/lib/auth-edge.config';

const { auth } = NextAuth(authEdgeConfig);

export default auth(async (req) => {
  const session = req.auth;
  if (!session?.user) {
    const signInUrl = new URL('/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ['/dashboard/:path*']
};
