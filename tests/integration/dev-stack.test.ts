/**
 * Dev-stack integration tests — verify every service in docker-compose.dev.yml
 * is reachable and responding correctly.
 *
 * Prerequisites: make dev   (or docker compose -f docker-compose.dev.yml up)
 *
 * Env vars (all optional — defaults match docker-compose.dev.yml port mappings):
 *   NEXTJS_URL           default http://localhost:3000
 *   NGINX_URL            default http://localhost:80
 *   LLM_AGGREGATOR_URL   default http://localhost:4001
 *   USER_ANALYTICS_URL   default http://localhost:4002
 *   MODEL_WIDGET_URL     default http://localhost:5174
 *   REDIS_COMMANDER_URL  default http://localhost:8082
 *   PGADMIN_URL          default http://localhost:5050
 *   PRISMA_STUDIO_URL    default http://localhost:5555
 *   POSTGRES_HOST        default localhost
 *   POSTGRES_PORT        default 5433
 *   POSTGRES_USER        default admin
 *   POSTGRES_PASSWORD    default mysecretpassword
 *   POSTGRES_DB          default mydatabase
 *   REDIS_HOST           default localhost
 *   REDIS_PORT           default 6379
 */
import { describe, it, expect } from 'bun:test';

const NEXTJS        = process.env.NEXTJS_URL           ?? 'http://localhost:3000';
const NGINX         = process.env.NGINX_URL            ?? 'http://localhost:80';
const LLM           = process.env.LLM_AGGREGATOR_URL   ?? 'http://localhost:4001';
const ANALYTICS     = process.env.USER_ANALYTICS_URL   ?? 'http://localhost:4002';
const WIDGET        = process.env.MODEL_WIDGET_URL      ?? 'http://localhost:5174';
const REDIS_CMD     = process.env.REDIS_COMMANDER_URL   ?? 'http://localhost:8082';
const PGADMIN       = process.env.PGADMIN_URL           ?? 'http://localhost:5050';
const PRISMA_STUDIO = process.env.PRISMA_STUDIO_URL     ?? 'http://localhost:5555';
const PG_HOST       = process.env.POSTGRES_HOST         ?? 'localhost';
const PG_PORT       = Number(process.env.POSTGRES_PORT  ?? 5433);
const PG_USER       = process.env.POSTGRES_USER         ?? 'admin';
const PG_PASS       = process.env.POSTGRES_PASSWORD     ?? 'mysecretpassword';
const PG_DB         = process.env.POSTGRES_DB           ?? 'mydatabase';
const REDIS_HOST    = process.env.REDIS_HOST            ?? 'localhost';
const REDIS_PORT    = Number(process.env.REDIS_PORT     ?? 6379);

const HTTP_TIMEOUT  = 10_000;

async function get(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(HTTP_TIMEOUT),
    redirect: 'follow',
    ...opts
  });
  return res;
}

function spawn(cmd: string[]): { ok: boolean; stdout: string; stderr: string } {
  const p = Bun.spawnSync(cmd, { stdout: 'pipe', stderr: 'pipe' });
  return {
    ok: p.exitCode === 0,
    stdout: p.stdout.toString().trim(),
    stderr: p.stderr.toString().trim()
  };
}

// ── Next.js app (:3000) ───────────────────────────────────────────────────────

describe('dev-stack / nextjs-app (:3000)', () => {
  it('GET / — returns 200', async () => {
    const res = await get(NEXTJS);
    expect(res.status).toBe(200);
  });

  it('GET /api/auth/session — returns 200', async () => {
    const res = await get(`${NEXTJS}/api/auth/session`);
    expect(res.status).toBe(200);
  });

  it('GET /api/auth/session — returns JSON', async () => {
    const res = await get(`${NEXTJS}/api/auth/session`);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toContain('application/json');
  });
});

// ── nginx (:80) ───────────────────────────────────────────────────────────────

describe('dev-stack / nginx (:80)', () => {
  it('GET / — proxies to Next.js, returns 200', async () => {
    const res = await get(NGINX);
    expect(res.status).toBe(200);
  });

  it('GET /api/auth/session — proxies API route correctly', async () => {
    const res = await get(`${NGINX}/api/auth/session`);
    expect(res.status).toBe(200);
  });
});

// ── llm-aggregator (:4001) ────────────────────────────────────────────────────

describe('dev-stack / llm-aggregator (:4001)', () => {
  it('GET /health — returns 200 with status ok', async () => {
    const res = await get(`${LLM}/health`);
    const body = await res.json<{ status: string; service: string }>();
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('llm-aggregator');
  });

  it('GET /metrics — exposes Prometheus text metrics', async () => {
    const res = await get(`${LLM}/metrics`);
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('# HELP');
  });

  it('GET /models — returns data array', async () => {
    const res = await get(`${LLM}/models?limit=3`);
    const body = await res.json<{ data: unknown[] }>();
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('GET /models?limit=2 — respects limit param', async () => {
    const res = await get(`${LLM}/models?limit=2`);
    const body = await res.json<{ data: unknown[] }>();
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  it('GET /models/trending — returns trending list', async () => {
    const res = await get(`${LLM}/models/trending`);
    const body = await res.json<{ data: unknown[] }>();
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ── user-analytics (:4002) ────────────────────────────────────────────────────

describe('dev-stack / user-analytics (:4002)', () => {
  const userId = `devstack-smoke-${Date.now()}`;

  it('GET /health — returns 200 with status ok', async () => {
    const res = await get(`${ANALYTICS}/health`);
    const body = await res.json<{ status: string; service: string }>();
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('user-analytics');
  });

  it('GET /metrics — exposes Prometheus text metrics', async () => {
    const res = await get(`${ANALYTICS}/metrics`);
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toContain('text/plain');
  });

  it('POST /events — creates an event (201)', async () => {
    const res = await get(`${ANALYTICS}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        eventType: 'model_view',
        payload: { modelId: 'test-model' }
      })
    });
    expect(res.status).toBe(201);
    const body = await res.json<{ id: string }>();
    expect(body.id).toBeDefined();
  });

  it('GET /events/:userId — returns created events', async () => {
    const res = await get(`${ANALYTICS}/events/${userId}`);
    const body = await res.json<{ data: unknown[] }>();
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('PUT /preferences/:userId — upserts preferences (200)', async () => {
    const res = await get(`${ANALYTICS}/preferences/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'dark', defaultFilter: 'text-generation' })
    });
    expect(res.status).toBe(200);
  });

  it('GET /preferences/:userId — returns saved preferences', async () => {
    const res = await get(`${ANALYTICS}/preferences/${userId}`);
    const body = await res.json<{ data: { theme: string } }>();
    expect(res.status).toBe(200);
    expect(body.data.theme).toBe('dark');
  });
});

// ── model-widget (:5174) ──────────────────────────────────────────────────────

describe('dev-stack / model-widget (:5174)', () => {
  it('GET /widget/ — returns 200', async () => {
    const res = await get(`${WIDGET}/widget/`);
    expect(res.status).toBe(200);
  });

  it('GET /widget/ — returns HTML', async () => {
    const res = await get(`${WIDGET}/widget/`);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toContain('text/html');
  });
});

// ── redis-commander (:8082) ───────────────────────────────────────────────────

describe('dev-stack / redis-commander (:8082)', () => {
  it('GET / — UI is reachable (status < 500)', async () => {
    const res = await get(REDIS_CMD);
    expect(res.status).toBeLessThan(500);
  });
});

// ── pgadmin (:5050) ───────────────────────────────────────────────────────────

describe('dev-stack / pgadmin (:5050)', () => {
  it('GET / — login page is reachable (status < 500)', async () => {
    const res = await get(PGADMIN);
    expect(res.status).toBeLessThan(500);
  });
});

// ── prisma-studio (:5555) ─────────────────────────────────────────────────────

describe('dev-stack / prisma-studio (:5555)', () => {
  it('GET / — Studio UI is reachable (200)', async () => {
    const res = await get(PRISMA_STUDIO);
    expect(res.status).toBe(200);
  });
});

// ── Postgres (:5433) ──────────────────────────────────────────────────────────

describe('dev-stack / postgres (:5433)', () => {
  it('pg_isready — accepting connections', () => {
    const { ok, stderr } = spawn([
      'pg_isready', '-h', PG_HOST, '-p', String(PG_PORT), '-U', PG_USER, '-t', '5'
    ]);
    expect(ok, `pg_isready failed: ${stderr}`).toBe(true);
  });

  it('can connect and execute a query', async () => {
    const { Pool } = await import('pg');
    const pool = new Pool({
      host: PG_HOST,
      port: PG_PORT,
      user: PG_USER,
      password: PG_PASS,
      database: PG_DB,
      connectionTimeoutMillis: 5000,
      max: 1
    });
    try {
      const result = await pool.query<{ val: number }>('SELECT 1 AS val');
      expect(result.rows[0].val).toBe(1);
    } finally {
      await pool.end();
    }
  });

  it('target database exists', async () => {
    const { Pool } = await import('pg');
    const pool = new Pool({
      host: PG_HOST,
      port: PG_PORT,
      user: PG_USER,
      password: PG_PASS,
      database: PG_DB,
      connectionTimeoutMillis: 5000,
      max: 1
    });
    try {
      const result = await pool.query<{ datname: string }>(
        "SELECT datname FROM pg_database WHERE datname = $1",
        [PG_DB]
      );
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].datname).toBe(PG_DB);
    } finally {
      await pool.end();
    }
  });
});

// ── Redis (:6379) ─────────────────────────────────────────────────────────────

describe('dev-stack / redis (:6379)', () => {
  it('PING — redis is alive', () => {
    const { ok, stdout, stderr } = spawn([
      'redis-cli', '-h', REDIS_HOST, '-p', String(REDIS_PORT), 'PING'
    ]);
    expect(ok, `redis-cli PING failed: ${stderr}`).toBe(true);
    expect(stdout).toBe('PONG');
  });

  it('SET / GET — can read and write', () => {
    const key = `test:devstack:${Date.now()}`;

    const set = spawn([
      'redis-cli', '-h', REDIS_HOST, '-p', String(REDIS_PORT),
      'SET', key, 'ok', 'EX', '10'
    ]);
    expect(set.ok, `SET failed: ${set.stderr}`).toBe(true);
    expect(set.stdout).toBe('OK');

    const get = spawn([
      'redis-cli', '-h', REDIS_HOST, '-p', String(REDIS_PORT), 'GET', key
    ]);
    expect(get.ok, `GET failed: ${get.stderr}`).toBe(true);
    expect(get.stdout).toBe('ok');
  });

  it('INFO server — returns server info block', () => {
    const { ok, stdout, stderr } = spawn([
      'redis-cli', '-h', REDIS_HOST, '-p', String(REDIS_PORT), 'INFO', 'server'
    ]);
    expect(ok, `INFO failed: ${stderr}`).toBe(true);
    expect(stdout).toContain('redis_version');
  });
});
