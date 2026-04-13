/**
 * Smoke tests — verify all services are reachable after deployment.
 * Run after every deploy: bun test tests/smoke/
 *
 * Env vars:
 *   APP_URL              — Next.js app base URL
 *   LLM_AGGREGATOR_URL  — llm-aggregator base URL
 *   USER_ANALYTICS_URL  — user-analytics base URL
 *   MODEL_WIDGET_URL    — model-widget base URL
 */
import { describe, it, expect } from 'bun:test';

const APP = process.env.APP_URL ?? 'http://localhost:3000';
const LLM_AGGREGATOR =
  process.env.LLM_AGGREGATOR_URL ?? 'http://localhost:4001';
const USER_ANALYTICS =
  process.env.USER_ANALYTICS_URL ?? 'http://localhost:4002';
const MODEL_WIDGET = process.env.MODEL_WIDGET_URL ?? 'http://localhost:5174';

async function ping(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  return res.status;
}

describe('Smoke — all services reachable', () => {
  it('Next.js app — / returns 200', async () => {
    expect(await ping(APP)).toBe(200);
  });

  it('Next.js app — /api/auth/session returns 200', async () => {
    expect(await ping(`${APP}/api/auth/session`)).toBe(200);
  });

  it('llm-aggregator — /health returns 200', async () => {
    expect(await ping(`${LLM_AGGREGATOR}/health`)).toBe(200);
  });

  it('llm-aggregator — /models returns 200', async () => {
    expect(await ping(`${LLM_AGGREGATOR}/models?limit=1`)).toBe(200);
  });

  it('user-analytics — /health returns 200', async () => {
    expect(await ping(`${USER_ANALYTICS}/health`)).toBe(200);
  });

  it('model-widget — /widget/ returns 200', async () => {
    expect(await ping(`${MODEL_WIDGET}/widget/`)).toBe(200);
  });
});
