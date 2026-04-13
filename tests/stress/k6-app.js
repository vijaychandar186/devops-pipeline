/**
 * k6 load test for the main Next.js app.
 *
 * Run:
 *   k6 run tests/stress/k6-app.js \
 *     -e BASE_URL=http://localhost:3000 \
 *     --out json=results/k6-app.json
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 30 },
    { duration: '30s', target: 0 }
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.02']
  }
};

const BASE = __ENV.BASE_URL ?? 'http://localhost:3000';

export default function () {
  const pages = ['/', '/api/auth/session'];
  const url = `${BASE}${pages[Math.floor(Math.random() * pages.length)]}`;

  const res = http.get(url);
  const ok = check(res, { 'status < 400': (r) => r.status < 400 });
  errorRate.add(!ok);
  sleep(Math.random() * 2);
}
