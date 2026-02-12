import PageContainer from '@/components/layout/page-container';
import { ModelComparisonAreaSkeleton } from '@/components/dashboard/overview/model-comparison-area-skeleton';
import { TopModelsBarSkeleton } from '@/components/dashboard/overview/top-models-bar-skeleton';
import { DownloadDistributionPieSkeleton } from '@/components/dashboard/overview/download-distribution-pie-skeleton';
import { TrendingModelsSkeleton } from '@/components/dashboard/overview/trending-models-skeleton';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className='space-y-2'>
                <Skeleton className='h-3 w-28' />
                <Skeleton className='h-6 w-20' />
                <Skeleton className='h-4 w-16' />
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5'>
                <Skeleton className='h-4 w-40' />
                <Skeleton className='h-3 w-48' />
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>
            <TopModelsBarSkeleton />
          </div>
          <div className='col-span-4 md:col-span-3'>
            <TrendingModelsSkeleton />
          </div>
          <div className='col-span-4'>
            <ModelComparisonAreaSkeleton />
          </div>
          <div className='col-span-4 md:col-span-3'>
            <DownloadDistributionPieSkeleton />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
