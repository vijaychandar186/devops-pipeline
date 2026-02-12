'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className='container mx-auto max-w-md p-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-center text-red-600'>
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='mb-4 text-center'>
              This invitation link is invalid or has expired.
            </p>
            <div className='flex justify-center'>
              <Button onClick={() => router.push('/dashboard/overview')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className='container mx-auto max-w-md p-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex flex-col items-center justify-center space-y-4'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white' />
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className='container mx-auto max-w-md p-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-center'>Join DevOps Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='mb-4 text-center'>Please sign in to continue</p>
            <div className='flex justify-center'>
              <Button
                onClick={() =>
                  router.push(
                    `/signin?callbackUrl=${encodeURIComponent(
                      `/signup?token=${token}`
                    )}`
                  )
                }
                className='w-full'
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-md p-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-center'>You&apos;re Signed In</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='mb-4 text-center'>
            You can now continue to your dashboard.
          </p>
          <div className='flex justify-center'>
            <Button onClick={() => router.push('/dashboard/overview')}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
