import PageContainer from '@/components/layout/page-container';
import Navbar from '@/components/landing/navbar';
import LegalContent from '@/components/landing/legal-content';
import FooterSection from '@/components/landing/footer-section';
import { privacyContent } from '@/features/privacy/constants/privacyContent';

export default function PrivacyPage() {
  return (
    <PageContainer>
      <div className='bg-background text-foreground min-h-screen'>
        <Navbar />
        <main className='mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8'>
          <LegalContent
            title={privacyContent.title}
            lastUpdated={privacyContent.lastUpdated}
            sections={privacyContent.sections}
          />
        </main>
        <FooterSection />
      </div>
    </PageContainer>
  );
}
