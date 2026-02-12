import PageContainer from '@/components/layout/page-container';
import Navbar from '@/components/landing/navbar';
import HeroSection from '@/components/landing/hero-section';
import FeaturesSection from '@/components/landing/features-section';
import FooterSection from '@/components/landing/footer-section';

export default function LandingPage() {
  return (
    <PageContainer>
      <div className='bg-background text-foreground min-h-screen'>
        <Navbar />
        <HeroSection />
        <main className='mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8'>
          <FeaturesSection />
        </main>
        <FooterSection />
      </div>
    </PageContainer>
  );
}
