import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { formatCompact } from '@/lib/utils';

interface TrendingModelsProps {
  data: {
    name: string;
    id: string;
    downloads: number;
    likes: number;
  }[];
}

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function TrendingModels({ data }: TrendingModelsProps) {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Trending Models</CardTitle>
        <CardDescription>
          Currently trending text-generation models on Hugging Face.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-5'>
          {data.map((model) => (
            <div key={model.id} className='flex items-center'>
              <Avatar className='h-8 w-8'>
                <AvatarFallback>{getInitials(model.name)}</AvatarFallback>
              </Avatar>
              <div className='ml-4 min-w-0 flex-1 space-y-1'>
                <p className='truncate text-sm leading-none font-medium'>
                  {model.name}
                </p>
                <p className='text-muted-foreground truncate text-sm'>
                  {model.id}
                </p>
              </div>
              <div className='ml-auto text-sm font-medium'>
                {formatCompact(model.downloads)} DLs
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
