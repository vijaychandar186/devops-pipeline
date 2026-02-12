import type { Metadata } from 'next';
import LandingPage from '@/features/landing/LandingPage';

export const metadata: Metadata = {
  title: 'DevOps Pipeline | CI/CD & Cloud Native',
  description:
    'An end-to-end DevOps CI/CD pipeline showcasing automation, containerization, and cloud-native deployment practices.'
};

export default function HomePage() {
  return <LandingPage />;
}
