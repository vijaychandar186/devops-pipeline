import type { Metadata } from 'next';
import PrivacyPage from '@/features/privacy/PrivacyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | DevOps Pipeline',
  description:
    'Privacy Policy for DevOps Pipeline — CI/CD automation, containerization, and cloud-native deployment.'
};

export default function Privacy() {
  return <PrivacyPage />;
}
