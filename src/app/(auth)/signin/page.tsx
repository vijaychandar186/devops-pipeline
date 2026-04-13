import type { Metadata } from 'next';
import SignInViewPage from '@/components/auth/sign-in-view';

export const metadata: Metadata = {
  title: 'Sign In | DevOps Pipeline',
  description: 'Sign in to access the DevOps Pipeline dashboard.'
};

export default function Page() {
  return <SignInViewPage />;
}
