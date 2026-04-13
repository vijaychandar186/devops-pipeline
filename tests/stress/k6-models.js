/**
 * k6 stress / load test for the llm-aggregator /models endpoint.
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run:
 *   k6 run tests/stress/k6-models.js \
 *     -e BASE_URL=http://localhost:4001 \
 *     --out json=results/k6-models.json
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const ttfb = new Trend('time_to_first_byte');

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up
    { duration: '1m', target: 20 }, // sustained load
    { duration: '30s', target: 50 }, // spike
    { duration: '30s', target: 0 } // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<500'], // 95th percentile <500ms
    errors: ['rate<0.01']
  }
};

const BASE = __ENV.BASE_URL ?? 'http://localhost:4001';

export default function () {
  const endpoints = [
    `${BASE}/models?filter=text-generation&sort=downloads&limit=10`,
    `${BASE}/models/trending`,
    `${BASE}/health`
  ];

  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(url);

  ttfb.add(res.timings.waiting);

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'body is json': (r) =>
      r.headers['Content-Type']?.includes('application/json') ?? false,
    'has data field': (r) => {
      try {
        return 'data' in JSON.parse(r.body) || 'status' in JSON.parse(r.body);
      } catch {
        return false;
      }
    }
  });

  errorRate.add(!ok);
  sleep(1);
}
