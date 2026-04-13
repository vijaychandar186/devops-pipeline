/**
 * Integration tests — require llm-aggregator running on localhost:4001
 * Run with: LLM_AGGREGATOR_URL=http://localhost:4001 bun test tests/integration/llm-aggregator.test.ts
 */
import { describe, it, expect, beforeAll } from 'bun:test';

const BASE = process.env.LLM_AGGREGATOR_URL ?? 'http://localhost:4001';

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json() };
}

describe('llm-aggregator integration', () => {
  it('GET /health — returns 200 with status ok', async () => {
    const { status, body } = await get('/health');
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('llm-aggregator');
  });

  it('GET /metrics — returns prometheus text', async () => {
    const res = await fetch(`${BASE}/metrics`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
  });

  it('GET /models — returns models array', async () => {
    const { status, body } = await get('/models?limit=5');
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('id');
    expect(body.data[0]).toHaveProperty('downloads');
  });

  it('GET /models/trending — returns trending models', async () => {
    const { status, body } = await get('/models/trending');
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /models — respects limit param', async () => {
    const { body } = await get('/models?limit=3');
    expect(body.data.length).toBeLessThanOrEqual(3);
  });
});
