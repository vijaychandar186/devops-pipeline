'use client';

import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';

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

interface DownloadDistributionPieProps {
  data: { model: string; downloads: number }[];
}

export function DownloadDistributionPie({
  data
}: DownloadDistributionPieProps) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      downloads: { label: 'Downloads' }
    };
    data.forEach((item) => {
      config[item.model] = {
        label: item.model,
        color: 'var(--primary)'
      };
    });
    return config;
  }, [data]);

  const totalDownloads = React.useMemo(
    () => data.reduce((acc, curr) => acc + curr.downloads, 0),
    [data]
  );

  const pieData = React.useMemo(
    () =>
      data.map((item, index) => ({
        ...item,
        fill: `url(#fillPie${index})`
      })),
    [data]
  );

  return (
    <Card className='@container/card h-full'>
      <CardHeader>
        <CardTitle>Download Distribution</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Download share among the top 5 text-generation models
          </span>
          <span className='@[540px]/card:hidden'>Top 5 model share</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[200px]'
        >
          <PieChart>
            <defs>
              {data.map((_, index) => (
                <linearGradient
                  key={index}
                  id={`fillPie${index}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor='var(--primary)'
                    stopOpacity={1 - index * 0.15}
                  />
                  <stop
                    offset='100%'
                    stopColor='var(--primary)'
                    stopOpacity={0.8 - index * 0.15}
                  />
                </linearGradient>
              ))}
            </defs>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  nameKey='model'
                  formatter={(value) => formatCompact(value as number)}
                />
              }
            />
            <Pie
              data={pieData}
              dataKey='downloads'
              nameKey='model'
              innerRadius={50}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-2xl font-bold'
                        >
                          {formatCompact(totalDownloads)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Downloads
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 leading-none font-medium'>
          {data[0]?.model} leads with{' '}
          {((data[0]?.downloads / totalDownloads) * 100).toFixed(1)}% of
          downloads
        </div>
      </CardFooter>
    </Card>
  );
}
