import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  output: 'standalone'
};

const sentryEnabled = process.env.NODE_ENV !== 'development';

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
  org: 'vijaychandar186',
  project: 'javascript-nextjs',

  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload wider set of client source files for better stack trace resolution
  widenClientFileUpload: true,

  // Proxy Sentry requests through /monitoring to bypass ad-blockers
  tunnelRoute: '/monitoring',

  // Suppress non-CI build output
  silent: !process.env.CI
})
  : nextConfig;
