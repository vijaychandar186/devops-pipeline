import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { TopModelsBar } from '../../components/dashboard/overview/top-models-bar';
import { ModelComparisonArea } from '../../components/dashboard/overview/model-comparison-area';
import { DownloadDistributionPie } from '../../components/dashboard/overview/download-distribution-pie';
import { TrendingModels } from '../../components/dashboard/overview/trending-models';
import { TrendingUp, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCompact } from '@/lib/utils';
import type { LLMDashboardData } from '@/features/overview/actions/fetch-llm-data';

export default function OverViewPage({ data }: { data: LLMDashboardData }) {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {data.topModels.map((model, i) => (
            <Card key={model.id} className='@container/card'>
              <CardHeader>
                <CardDescription>#{i + 1} Most Downloaded</CardDescription>
                <CardTitle className='text-xl font-semibold tabular-nums @[250px]/card:text-2xl'>
                  {formatCompact(model.downloads)}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline'>
                    <TrendingUp />
                    {formatCompact(model.likes)} likes
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>
                  {model.name} <Download className='size-4' />
                </div>
                <div className='text-muted-foreground line-clamp-1'>
                  {model.id}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>
            <TopModelsBar data={data.barChartData} />
          </div>
          <div className='col-span-4 md:col-span-3'>
            <TrendingModels data={data.trendingModels} />
          </div>
          <div className='col-span-4'>
            <ModelComparisonArea data={data.barChartData} />
          </div>
          <div className='col-span-4 md:col-span-3'>
            <DownloadDistributionPie data={data.pieChartData} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
