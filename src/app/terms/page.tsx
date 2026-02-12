import type { Metadata } from 'next';
import TermsPage from '@/features/terms/TermsPage';

export const metadata: Metadata = {
  title: 'Terms of Service | DevOps Pipeline',
  description:
    'Terms of Service for DevOps Pipeline — CI/CD automation, containerization, and cloud-native deployment.'
};

export default function Terms() {
  return <TermsPage />;
}
