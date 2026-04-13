import { describe, it, expect, mock, beforeEach } from 'bun:test';

// Mock ioredis
const mockGet = mock(() => Promise.resolve(null));
const mockSet = mock(() => Promise.resolve('OK'));
mock.module('ioredis', () => ({
  default: class {
    get = mockGet;
    set = mockSet;
  }
}));

const { getOrSet } =
  await import('../../../services/llm-aggregator/src/lib/cache');

describe('Cache — getOrSet', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
  });

  it('calls fetcher and caches result on cache miss', async () => {
    const fetcher = mock(() => Promise.resolve({ id: 'model-1' }));
    const result = await getOrSet('key:1', 300, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(
      'key:1',
      JSON.stringify({ id: 'model-1' }),
      'EX',
      300
    );
    expect(result).toEqual({ id: 'model-1' });
  });

  it('returns cached value without calling fetcher on hit', async () => {
    mockGet.mockResolvedValueOnce(JSON.stringify({ id: 'cached' }));
    const fetcher = mock(() => Promise.resolve({ id: 'fresh' }));

    const result = await getOrSet('key:2', 300, fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'cached' });
  });
});
