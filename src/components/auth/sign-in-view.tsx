import Link from 'next/link';
import { Workflow } from 'lucide-react';
import UserAuthForm from './auth-form';

export default function SignInViewPage() {
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <Link href='/'>
          <div className='relative z-20 flex items-center text-lg font-medium'>
            <Workflow className='mr-2 h-6 w-6' />
            DevOps Pipeline
          </div>
        </Link>

        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;A hands-on DevOps learning project where I implement
              real-world tools and practices — from CI/CD pipelines to
              containerization and cloud deployments.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center p-4 lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Get Started
            </h1>
            <p className='text-muted-foreground text-sm'>
              Sign in to access your dashboard
            </p>
          </div>
          <UserAuthForm />

          <p className='text-muted-foreground px-8 text-center text-sm'>
            By continuing, you agree to our{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
