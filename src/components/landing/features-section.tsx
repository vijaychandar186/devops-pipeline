import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FeatureIcons } from '@/components/icons';
import { featuresContent } from '@/features/landing/constants/featuresContent';

type IconName = keyof typeof FeatureIcons;

export default function FeaturesSection() {
  return (
    <section id='features' className='mb-12 scroll-mt-20 sm:mb-16'>
      <div className='mb-8 flex items-center justify-between'>
        <h2 className='text-2xl font-bold sm:text-3xl'>
          {featuresContent.sectionTitle}
        </h2>
        <Separator className='ml-4 hidden flex-1 sm:block' />
      </div>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3'>
        {featuresContent.features.map((feature, index) => {
          const IconComponent = FeatureIcons[feature.icon as IconName];
          return (
            <Card
              key={index}
              className='hover:border-primary/50 flex flex-col transition-all duration-300 hover:shadow-lg'
            >
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
                  <IconComponent className='text-primary h-5 w-5' />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p className='text-muted-foreground text-sm'>
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
