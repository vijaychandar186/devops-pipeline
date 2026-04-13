const HF_API = 'https://huggingface.co/api';

export interface HFModel {
  id: string;
  downloads: number;
  likes: number;
  trendingScore: number;
  lastModified: string;
  tags: string[];
}

export async function fetchModels(params: {
  filter?: string;
  sort?: string;
  limit?: number;
  search?: string;
}): Promise<HFModel[]> {
  const { filter = 'text-generation', sort = 'downloads', limit = 500, search } = params;
  const base = `${HF_API}/models?filter=${filter}&sort=${sort}&limit=${limit}&full=false&props=id,downloads,likes,trendingScore,lastModified,tags`;
  const url = search ? `${base}&search=${encodeURIComponent(search)}` : base;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HuggingFace API error: ${res.status}`);

  const data = (await res.json()) as HFModel[];
  return data;
}

export async function fetchTrending(limit = 5): Promise<HFModel[]> {
  return fetchModels({ sort: 'trendingScore', limit });
}
