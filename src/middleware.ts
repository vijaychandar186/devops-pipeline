import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // Redirect unauthenticated users to signin
  if (!session?.user) {
    return Response.redirect(new URL('/signin', req.url));
  }

  // If authenticated, allow access
  return;
});

export const config = {
  matcher: ['/dashboard/:path*']
};
