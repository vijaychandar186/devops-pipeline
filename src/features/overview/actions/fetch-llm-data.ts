interface HFModel {
  id: string;
  downloads: number;
  likes: number;
}

export interface LLMDashboardData {
  topModels: {
    name: string;
    id: string;
    downloads: number;
    likes: number;
  }[];
  barChartData: {
    model: string;
    downloads: number;
    likes: number;
  }[];
  pieChartData: {
    model: string;
    downloads: number;
  }[];
  trendingModels: {
    name: string;
    id: string;
    downloads: number;
    likes: number;
  }[];
}

function shortName(modelId: string): string {
  // "meta-llama/Llama-3.1-8B" -> "Llama 3.1 8B"
  const name = modelId.split('/').pop() || modelId;
  return name.replace(/-/g, ' ');
}

export async function fetchLLMData(): Promise<LLMDashboardData> {
  const [topRes, trendingRes] = await Promise.all([
    fetch(
      'https://huggingface.co/api/models?sort=downloads&direction=-1&limit=20&filter=text-generation',
      { cache: 'no-store' }
    ),
    fetch(
      'https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=10&filter=text-generation',
      { cache: 'no-store' }
    )
  ]);

  if (!topRes.ok || !trendingRes.ok) {
    throw new Error('Failed to fetch data from Hugging Face API');
  }

  const topRaw: HFModel[] = await topRes.json();
  const trendingRaw: HFModel[] = await trendingRes.json();

  const topModels = topRaw.slice(0, 4).map((m) => ({
    name: shortName(m.id),
    id: m.id,
    downloads: m.downloads,
    likes: m.likes
  }));

  const barChartData = topRaw.slice(0, 10).map((m) => ({
    model: shortName(m.id),
    downloads: m.downloads,
    likes: m.likes
  }));

  const pieChartData = topRaw.slice(0, 5).map((m) => ({
    model: shortName(m.id),
    downloads: m.downloads
  }));

  const trendingModels = trendingRaw.slice(0, 5).map((m) => ({
    name: shortName(m.id),
    id: m.id,
    downloads: m.downloads,
    likes: m.likes
  }));

  return { topModels, barChartData, pieChartData, trendingModels };
}
