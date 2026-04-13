import PageContainer from '@/components/layout/page-container';
import Navbar from '@/components/landing/navbar';
import LegalContent from '@/components/landing/legal-content';
import FooterSection from '@/components/landing/footer-section';
import { termsContent } from '@/features/terms/constants/termsContent';

export default function TermsPage() {
  return (
    <PageContainer>
      <div className='bg-background text-foreground min-h-screen'>
        <Navbar />
        <main className='mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8'>
          <LegalContent
            title={termsContent.title}
            lastUpdated={termsContent.lastUpdated}
            sections={termsContent.sections}
          />
        </main>
        <FooterSection />
      </div>
    </PageContainer>
  );
}
