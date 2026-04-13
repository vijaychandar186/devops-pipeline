import express from 'express';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram
} from 'prom-client';
import modelsRouter from './routes/models';

const app = express();
const PORT = Number(process.env.PORT ?? 4001);

// ── Prometheus metrics ────────────────────────────────────────────────────────
const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const httpRequests = new Counter({
  name: 'llm_aggregator_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry]
});

export const httpDuration = new Histogram({
  name: 'llm_aggregator_http_duration_seconds',
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
  res.json({ status: 'ok', service: 'llm-aggregator' })
);

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

app.use('/models', modelsRouter);

app.listen(PORT, () => console.log(`llm-aggregator listening on :${PORT}`));
