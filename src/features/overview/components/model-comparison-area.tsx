'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { formatCompact } from '@/lib/utils';

const chartConfig = {
  downloads: {
    label: 'Downloads',
    color: 'var(--primary)'
  },
  likes: {
    label: 'Likes',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

interface ModelComparisonAreaProps {
  data: { model: string; downloads: number; likes: number }[];
}

export function ModelComparisonArea({ data }: ModelComparisonAreaProps) {
  return (
    <Card className='@container/card h-full'>
      <CardHeader>
        <CardTitle>Downloads vs Likes</CardTitle>
        <CardDescription>
          Comparing downloads and likes across top models
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[200px] w-full'
        >
          <AreaChart
            data={data}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillDownloads' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-downloads)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-downloads)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillLikes' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-likes)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-likes)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='model'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-35}
              textAnchor='end'
              height={60}
              interval={0}
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => (v.length > 14 ? v.slice(0, 13) + '…' : v)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompact}
              width={45}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator='dot'
                  formatter={(value) => formatCompact(value as number)}
                />
              }
            />
            <Area
              dataKey='likes'
              type='natural'
              fill='url(#fillLikes)'
              stroke='var(--color-likes)'
              stackId='a'
            />
            <Area
              dataKey='downloads'
              type='natural'
              fill='url(#fillDownloads)'
              stroke='var(--color-downloads)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='text-muted-foreground text-sm'>
        Live data from Hugging Face Hub API
      </CardFooter>
    </Card>
  );
}
