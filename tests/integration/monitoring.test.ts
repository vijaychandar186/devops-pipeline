/**
 * Monitoring-stack integration tests — verify every observability service in
 * docker-compose.prod.yml is reachable and healthy.
 *
 * Prerequisites: make prod-up   (or docker compose -f docker-compose.prod.yml up -d)
 *
 * Env vars (all optional — defaults match docker-compose.prod.yml expose ports
 * which are only reachable from within Docker unless you add port mappings):
 *
 *   PROMETHEUS_URL              default http://localhost:9090
 *   GRAFANA_URL                 default http://localhost:3001
 *   TEMPO_URL                   default http://localhost:3200
 *   LOKI_URL                    default http://localhost:3100
 *   OTEL_COLLECTOR_METRICS_URL  default http://localhost:8888  (collector self-telemetry; 8889 is app metrics, empty until services push data)
 *   REDIS_EXPORTER_URL          default http://localhost:9121
 *   POSTGRES_EXPORTER_URL       default http://localhost:9187
 *   NGINX_EXPORTER_URL          default http://localhost:9113
 */
import { describe, it, expect } from 'bun:test';

const PROMETHEUS      = process.env.PROMETHEUS_URL             ?? 'http://localhost:9090';
const GRAFANA         = process.env.GRAFANA_URL                ?? 'http://localhost:3001';
const TEMPO           = process.env.TEMPO_URL                  ?? 'http://localhost:3200';
const LOKI            = process.env.LOKI_URL                   ?? 'http://localhost:3100';
const OTEL_METRICS    = process.env.OTEL_COLLECTOR_METRICS_URL ?? 'http://localhost:8888';
const REDIS_EXP       = process.env.REDIS_EXPORTER_URL         ?? 'http://localhost:9121';
const PG_EXP          = process.env.POSTGRES_EXPORTER_URL      ?? 'http://localhost:9187';
const NGINX_EXP       = process.env.NGINX_EXPORTER_URL         ?? 'http://localhost:9113';

const TIMEOUT = 10_000;

async function get(url: string) {
  return fetch(url, { signal: AbortSignal.timeout(TIMEOUT), redirect: 'follow' });
}

// ── Prometheus (:9090) ────────────────────────────────────────────────────────

describe('monitoring / prometheus (:9090)', () => {
  it('GET /-/healthy — returns 200 OK', async () => {
    const res = await get(`${PROMETHEUS}/-/healthy`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Prometheus');
  });

  it('GET /-/ready — returns 200 when ready', async () => {
    const res = await get(`${PROMETHEUS}/-/ready`);
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/targets — returns target list', async () => {
    const res = await get(`${PROMETHEUS}/api/v1/targets`);
    const body = await res.json<{ status: string; data: { activeTargets: unknown[] } }>();
    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(Array.isArray(body.data.activeTargets)).toBe(true);
  });

  it('GET /api/v1/query?query=up — returns metric data', async () => {
    const res = await get(`${PROMETHEUS}/api/v1/query?query=up`);
    const body = await res.json<{ status: string }>();
    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
  });
});

// ── Grafana (:3001) ───────────────────────────────────────────────────────────

describe('monitoring / grafana (:3001)', () => {
  it('GET /api/health — returns 200 with ok database', async () => {
    const res = await get(`${GRAFANA}/api/health`);
    const body = await res.json<{ database: string }>();
    expect(res.status).toBe(200);
    expect(body.database).toBe('ok');
  });

  it('GET / — login page is reachable', async () => {
    const res = await get(GRAFANA);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.toLowerCase()).toContain('grafana');
  });
});

// ── Tempo (:3200) ─────────────────────────────────────────────────────────────

describe('monitoring / tempo (:3200)', () => {
  it('GET /ready — returns 200', async () => {
    const res = await get(`${TEMPO}/ready`);
    expect(res.status).toBe(200);
  });

  it('GET /status — returns component status', async () => {
    const res = await get(`${TEMPO}/status`);
    expect(res.status).toBe(200);
  });
});

// ── Loki (:3100) ──────────────────────────────────────────────────────────────

describe('monitoring / loki (:3100)', () => {
  it('GET /ready — returns 200', async () => {
    const res = await get(`${LOKI}/ready`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text.toLowerCase()).toContain('ready');
  });

  it('GET /loki/api/v1/labels — returns label names', async () => {
    const res = await get(`${LOKI}/loki/api/v1/labels`);
    const body = await res.json<{ status: string }>();
    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
  });
});

// ── OpenTelemetry Collector metrics endpoint (:8889) ─────────────────────────

describe('monitoring / otel-collector (:8889)', () => {
  it('GET /metrics — exposes Prometheus-format collector metrics', async () => {
    const res = await get(`${OTEL_METRICS}/metrics`);
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('otelcol');
  });
});

// ── Redis exporter (:9121) ────────────────────────────────────────────────────

describe('monitoring / redis-exporter (:9121)', () => {
  it('GET /metrics — returns Redis metrics', async () => {
    const res = await get(`${REDIS_EXP}/metrics`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('redis_');
  });

  it('GET /metrics — includes uptime metric', async () => {
    const res = await get(`${REDIS_EXP}/metrics`);
    const text = await res.text();
    expect(text).toContain('redis_uptime_in_seconds');
  });
});

// ── Postgres exporter (:9187) ─────────────────────────────────────────────────

describe('monitoring / postgres-exporter (:9187)', () => {
  it('GET /metrics — returns pg metrics', async () => {
    const res = await get(`${PG_EXP}/metrics`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('pg_');
  });

  it('GET /metrics — includes up metric', async () => {
    const res = await get(`${PG_EXP}/metrics`);
    const text = await res.text();
    expect(text).toContain('pg_up');
  });
});

// ── nginx Prometheus exporter (:9113) ─────────────────────────────────────────

describe('monitoring / nginx-prometheus-exporter (:9113)', () => {
  it('GET /metrics — returns nginx stub_status metrics', async () => {
    const res = await get(`${NGINX_EXP}/metrics`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('nginx_');
  });

  it('GET /metrics — includes connections_active metric', async () => {
    const res = await get(`${NGINX_EXP}/metrics`);
    const text = await res.text();
    expect(text).toContain('nginx_connections_active');
  });
});
