'use client';

import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      void import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error);
      });
      return;
    }

    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
