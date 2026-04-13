import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { query } from '../lib/db';

const router = Router();

// GET /preferences/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const [row] = await query<{ preferences: Record<string, unknown> }>(
    `SELECT preferences FROM user_preferences WHERE user_id = $1`,
    [userId]
  );
  res.json({ data: row?.preferences ?? {} });
});

// PUT /preferences/:userId
router.put('/:userId', async (req: Request, res: Response) => {
  const PrefsSchema = z.record(z.unknown());
  const parsed = PrefsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid preferences payload' });
    return;
  }

  await query(
    `INSERT INTO user_preferences (user_id, preferences, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET preferences = $2, updated_at = NOW()`,
    [req.params.userId, JSON.stringify(parsed.data)]
  );

  res.json({ ok: true });
});

export default router;
