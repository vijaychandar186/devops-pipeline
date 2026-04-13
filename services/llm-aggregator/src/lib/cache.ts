import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const value = await fetcher();
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  return value;
}

export default redis;
