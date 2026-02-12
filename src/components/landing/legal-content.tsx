import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface LegalSection {
  heading: string;
  body: string;
}

interface LegalContentProps {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export default function LegalContent({
  title,
  lastUpdated,
  sections
}: LegalContentProps) {
  return (
    <section className='mb-12 scroll-mt-20 sm:mb-16'>
      <div className='mb-8'>
        <Badge variant='outline' className='mb-4'>
          Legal
        </Badge>
        <h1 className='mb-2 text-3xl font-bold tracking-tight sm:text-4xl'>
          {title}
        </h1>
        <p className='text-muted-foreground text-sm'>
          Last updated: {lastUpdated}
        </p>
      </div>
      <Separator className='mb-8' />
      <div className='space-y-8'>
        {sections.map((section, index) => (
          <div key={index}>
            <h2 className='mb-2 text-lg font-semibold sm:text-xl'>
              {section.heading}
            </h2>
            <p className='text-muted-foreground text-sm leading-relaxed sm:text-base'>
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
