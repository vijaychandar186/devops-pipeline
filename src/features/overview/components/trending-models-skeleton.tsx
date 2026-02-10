import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function TrendingModelsSkeleton() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <Skeleton className='h-6 w-[160px]' />
        <Skeleton className='h-4 w-[260px]' />
      </CardHeader>
      <CardContent>
        <div className='space-y-5'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center'>
              <Skeleton className='h-8 w-8 rounded-full' />
              <div className='ml-4 space-y-1'>
                <Skeleton className='h-4 w-[140px]' />
                <Skeleton className='h-4 w-[180px]' />
              </div>
              <Skeleton className='ml-auto h-4 w-[80px]' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
