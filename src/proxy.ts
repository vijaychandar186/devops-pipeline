import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // Redirect unauthenticated users
  if (!session?.user) return Response.redirect(new URL('/signin', req.url));

  // Dashboard protection: only allow authenticated users
  if (pathname.startsWith('/dashboard')) {
    // Optional: you can add extra checks here if needed
    return;
  }
});

export const config = {
  matcher: ['/dashboard/:path*']
};
