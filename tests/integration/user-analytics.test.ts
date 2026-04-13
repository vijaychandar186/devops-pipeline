/**
 * Integration tests — require user-analytics running on localhost:4002
 * Run with: USER_ANALYTICS_URL=http://localhost:4002 bun test tests/integration/user-analytics.test.ts
 */
import { describe, it, expect } from 'bun:test';

const BASE = process.env.USER_ANALYTICS_URL ?? 'http://localhost:4002';

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json() };
}

const testUserId = `test-user-${Date.now()}`;

describe('user-analytics integration', () => {
  it('GET /health — returns 200', async () => {
    const { status, body } = await req('GET', '/health');
    expect(status).toBe(200);
    expect(body.service).toBe('user-analytics');
  });

  it('POST /events — creates event', async () => {
    const { status, body } = await req('POST', '/events', {
      userId: testUserId,
      eventType: 'model_view',
      payload: { modelId: 'meta-llama/Llama-3' }
    });
    expect(status).toBe(201);
    expect(body.id).toBeDefined();
  });

  it('POST /events — rejects invalid payload', async () => {
    const { status } = await req('POST', '/events', { userId: '' });
    expect(status).toBe(400);
  });

  it('GET /events/:userId — returns events', async () => {
    const { status, body } = await req('GET', `/events/${testUserId}`);
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('PUT /preferences/:userId — upserts preferences', async () => {
    const { status } = await req('PUT', `/preferences/${testUserId}`, {
      theme: 'dark',
      defaultFilter: 'text-generation'
    });
    expect(status).toBe(200);
  });

  it('GET /preferences/:userId — returns preferences', async () => {
    const { status, body } = await req('GET', `/preferences/${testUserId}`);
    expect(status).toBe(200);
    expect(body.data.theme).toBe('dark');
  });
});
