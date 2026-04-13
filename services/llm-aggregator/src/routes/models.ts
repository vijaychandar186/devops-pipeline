import { Router, type Request, type Response } from 'express';
import { getOrSet } from '../lib/cache';
import { fetchModels, fetchTrending } from '../lib/huggingface';

const router = Router();
const CACHE_TTL = 300; // 5 minutes

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as string) ?? 'text-generation';
    const sort   = (req.query.sort   as string) ?? 'downloads';
    const search = (req.query.search as string) || undefined;
    const limit  = Math.max(1, Number(req.query.limit ?? 500));

    const cacheKey = `models:${filter}:${sort}:${limit}:${search ?? ''}`;
    const models = await getOrSet(cacheKey, CACHE_TTL, () =>
      fetchModels({ filter, sort, limit, search })
    );
    res.json({ data: models, cached: true, ttl: CACHE_TTL });
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch models' });
  }
});

router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const models = await getOrSet('models:trending', CACHE_TTL, () =>
      fetchTrending(5)
    );
    res.json({ data: models, cached: true, ttl: CACHE_TTL });
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch trending models' });
  }
});

router.delete('/cache', async (_req: Request, res: Response) => {
  const redis = (await import('../lib/cache')).default;
  const keys = await redis.keys('models:*');
  if (keys.length > 0) await redis.del(...keys);
  res.json({ flushed: keys.length });
});

export default router;
