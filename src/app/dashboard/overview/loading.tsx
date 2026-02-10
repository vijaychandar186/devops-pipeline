import PageContainer from '@/components/layout/page-container';
import { AreaGraphSkeleton } from '@/features/overview/components/area-graph-skeleton';
import { BarGraphSkeleton } from '@/features/overview/components/bar-graph-skeleton';
import { PieGraphSkeleton } from '@/features/overview/components/pie-graph-skeleton';
import { RecentSalesSkeleton } from '@/features/overview/components/recent-sales-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='space-y-4'>
          {/* Tabs skeleton */}
          <div className='flex gap-2'>
            <Skeleton className='h-9 w-24' />
            <Skeleton className='h-9 w-24' />
          </div>

          {/* Stats cards skeleton */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-32' />
                  <Skeleton className='h-5 w-16' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='mt-2 h-3 w-3/4' />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts skeleton */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <div className='col-span-4'>
              <BarGraphSkeleton />
            </div>
            <div className='col-span-4 md:col-span-3'>
              <RecentSalesSkeleton />
            </div>
            <div className='col-span-4'>
              <AreaGraphSkeleton />
            </div>
            <div className='col-span-4 md:col-span-3'>
              <PieGraphSkeleton />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
