import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { query } from '../lib/db';

const router = Router();

const EventSchema = z.object({
  userId: z.string().min(1),
  eventType: z.string().min(1),
  payload: z.record(z.unknown()).optional().default({})
});

// POST /events — track a user event
router.post('/', async (req: Request, res: Response) => {
  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { userId, eventType, payload } = parsed.data;
  const [row] = await query<{ id: string }>(
    `INSERT INTO user_events (user_id, event_type, payload) VALUES ($1, $2, $3) RETURNING id`,
    [userId, eventType, JSON.stringify(payload)]
  );

  res.status(201).json({ id: row.id });
});

// GET /events/:userId — recent events for a user
router.get('/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  const rows = await query(
    `SELECT id, event_type, payload, created_at FROM user_events
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );

  res.json({ data: rows });
});

export default router;
