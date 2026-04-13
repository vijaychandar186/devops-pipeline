import { describe, it, expect, mock, beforeEach } from 'bun:test';

// pg.Pool connects lazily (on first query, not on construction).
// Import the module first, then replace pool.query on the live instance
// to avoid fighting with bun's CJS mock.module interop for native modules.
const db = await import('../../../services/user-analytics/src/lib/db');

const mockQuery = mock(() => Promise.resolve({ rows: [{ id: '1' }] }));
// Shadow the prototype method with an own-property mock
(db.pool as unknown as Record<string, unknown>).query = mockQuery;

describe('db.query', () => {
  beforeEach(() => mockQuery.mockClear());

  it('returns rows from pool.query', async () => {
    const rows = await db.query<{ id: string }>('SELECT 1');
    expect(rows).toEqual([{ id: '1' }]);
  });

  it('passes params to pool.query', async () => {
    await db.query('SELECT $1', ['value']);
    expect(mockQuery).toHaveBeenCalledWith('SELECT $1', ['value']);
  });
});
