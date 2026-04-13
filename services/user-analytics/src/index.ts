import express from 'express';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram
} from 'prom-client';
import { migrate } from './lib/db';
import eventsRouter from './routes/events';
import preferencesRouter from './routes/preferences';

const app = express();
const PORT = Number(process.env.PORT ?? 4002);

// ── Prometheus metrics ────────────────────────────────────────────────────────
const registry = new Registry();
collectDefaultMetrics({ register: registry });

const httpRequests = new Counter({
  name: 'user_analytics_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry]
});

const httpDuration = new Histogram({
  name: 'user_analytics_http_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  registers: [registry]
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());

app.use((req, res, next) => {
  const end = httpDuration.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    httpRequests.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
    end();
  });
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'user-analytics' })
);

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

app.use('/events', eventsRouter);
app.use('/preferences', preferencesRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
migrate()
  .then(() =>
    app.listen(PORT, () => console.log(`user-analytics listening on :${PORT}`))
  )
  .catch((err) => {
    console.error('DB migration failed', err);
    process.exit(1);
  });
