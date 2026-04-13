import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock global fetch
const mockFetch = mock(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        {
          id: 'meta-llama/Llama-3',
          downloads: 5000000,
          likes: 1200,
          trendingScore: 250,
          lastModified: '2025-01-01',
          tags: ['text-generation']
        }
      ])
  })
);
global.fetch = mockFetch as unknown as typeof fetch;

import {
  fetchModels,
  fetchTrending
} from '../../../services/llm-aggregator/src/lib/huggingface';

describe('HuggingFace client', () => {
  beforeEach(() => mockFetch.mockClear());

  it('fetchModels — calls HF API with correct params', async () => {
    const models = await fetchModels({
      filter: 'text-generation',
      sort: 'downloads',
      limit: 5
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('filter=text-generation');
    expect(url).toContain('sort=downloads');
    expect(url).toContain('limit=5');
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('meta-llama/Llama-3');
  });

  it('fetchModels — defaults sort to downloads', async () => {
    await fetchModels({ filter: 'text-generation' });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('sort=downloads');
  });

  it('fetchTrending — sorts by trendingScore', async () => {
    await fetchTrending(3);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('sort=trendingScore');
    expect(url).toContain('limit=3');
  });

  it('fetchModels — throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 } as Response);
    await expect(fetchModels({})).rejects.toThrow('HuggingFace API error: 429');
  });
});
