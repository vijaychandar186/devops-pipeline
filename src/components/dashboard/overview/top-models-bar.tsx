'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
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

interface TopModelsBarProps {
  data: { model: string; downloads: number; likes: number }[];
}

export function TopModelsBar({ data }: TopModelsBarProps) {
  const [activeChart, setActiveChart] = React.useState<'downloads' | 'likes'>(
    'downloads'
  );

  const total = React.useMemo(
    () => ({
      downloads: data.reduce((acc, curr) => acc + curr.downloads, 0),
      likes: data.reduce((acc, curr) => acc + curr.likes, 0)
    }),
    [data]
  );

  return (
    <Card className='@container/card h-full !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Top LLM Models</CardTitle>
          <CardDescription>
            <span className='hidden @[540px]/card:block'>
              Top 10 text-generation models on Hugging Face
            </span>
            <span className='@[540px]/card:hidden'>Top 10 models</span>
          </CardDescription>
        </div>
        <div className='flex'>
          {(['downloads', 'likes'] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
              onClick={() => setActiveChart(key)}
            >
              <span className='text-muted-foreground text-xs'>
                {chartConfig[key].label}
              </span>
              <span className='text-base leading-none font-bold sm:text-xl'>
                {formatCompact(total[key])}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[200px] w-full'
        >
          <BarChart
            data={data}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillBar' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.2}
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
              cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  className='w-[180px]'
                  nameKey='model'
                  labelFormatter={(value) => value}
                  formatter={(value) => formatCompact(value as number)}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill='url(#fillBar)'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
