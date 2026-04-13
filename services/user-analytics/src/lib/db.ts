import { Pool } from 'pg';

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://admin:mysecretpassword@localhost:5432/mydatabase'
});

export async function query<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await pool.query(sql, params);
  return rows as T[];
}

// Create tables on startup — retries until Postgres is ready
export async function migrate(retries = 10, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_events (
          id          BIGSERIAL PRIMARY KEY,
          user_id     TEXT        NOT NULL,
          event_type  TEXT        NOT NULL,
          payload     JSONB       DEFAULT '{}',
          created_at  TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events (user_id);
        CREATE INDEX IF NOT EXISTS idx_user_events_type    ON user_events (event_type);

        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id     TEXT        PRIMARY KEY,
          preferences JSONB       NOT NULL DEFAULT '{}',
          updated_at  TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      return; // success
    } catch (err: unknown) {
      const isConnErr =
        err instanceof Error &&
        (err.message.includes('ECONNREFUSED') ||
          err.message.includes('connect'));
      if (!isConnErr || attempt === retries) throw err;
      console.warn(
        `DB not ready yet (attempt ${attempt}/${retries}), retrying in ${delayMs}ms…`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
