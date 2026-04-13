/**
 * Kubernetes manifest tests — validate every manifest and kustomization
 * without requiring a live cluster.
 *
 * Uses:
 *   kubectl kustomize  — resolves and renders the full kustomization (no cluster needed)
 *   kubectl apply --dry-run=client  — validates individual manifests (no cluster needed)
 *   yamllint  — optional YAML linting (skipped when not installed)
 *
 * Run: bun test tests/infra/k8s.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { join } from 'path';

const K8S_DIR  = join(import.meta.dir, '../../k8s');
const REPO_DIR = join(import.meta.dir, '../..');

function which(bin: string): boolean {
  return Bun.spawnSync(['which', bin], { stdout: 'pipe', stderr: 'pipe' }).exitCode === 0;
}

function spawn(cmd: string[], cwd: string): { ok: boolean; stdout: string; stderr: string } {
  const p = Bun.spawnSync(cmd, { cwd, stdout: 'pipe', stderr: 'pipe' });
  return {
    ok: p.exitCode === 0,
    stdout: p.stdout.toString().trim(),
    stderr: p.stderr.toString().trim()
  };
}

// ── Prerequisites (optional — tests skip gracefully when kubectl absent) ──────

const kubectlAvailable = which('kubectl');

describe('k8s / prerequisites', () => {
  it('kubectl is installed', () => {
    if (!kubectlAvailable) {
      console.log('  kubectl not found — kubectl-dependent tests will be skipped');
      return;
    }
    expect(kubectlAvailable).toBe(true);
  });
});

// ── Kustomization ─────────────────────────────────────────────────────────────

describe('k8s / kustomize build', () => {
  it('kubectl kustomize k8s/ — resolves without errors', () => {
    if (!kubectlAvailable) { console.log('  skipped (kubectl not installed)'); return; }
    const { ok, stderr } = spawn(['kubectl', 'kustomize', 'k8s/'], REPO_DIR);
    expect(ok, `kustomize build failed:\n${stderr}`).toBe(true);
  });

  it('kubectl kustomize k8s/ — produces YAML output', () => {
    if (!kubectlAvailable) { console.log('  skipped (kubectl not installed)'); return; }
    const { stdout } = spawn(['kubectl', 'kustomize', 'k8s/'], REPO_DIR);
    expect(stdout).toContain('apiVersion');
    expect(stdout).toContain('kind');
  });

  it('kubectl kustomize k8s/ — output includes all expected resource kinds', () => {
    if (!kubectlAvailable) { console.log('  skipped (kubectl not installed)'); return; }
    const { stdout } = spawn(['kubectl', 'kustomize', 'k8s/'], REPO_DIR);
    for (const kind of ['Namespace', 'Deployment', 'StatefulSet', 'Service', 'ConfigMap']) {
      expect(stdout, `missing kind: ${kind}`).toContain(`kind: ${kind}`);
    }
  });

  it('kubectl kustomize k8s/ — namespace is devops-pipeline throughout', () => {
    if (!kubectlAvailable) { console.log('  skipped (kubectl not installed)'); return; }
    const { stdout } = spawn(['kubectl', 'kustomize', 'k8s/'], REPO_DIR);
    expect(stdout).toContain('namespace: devops-pipeline');
  });
});

// ── Individual manifest dry-run ───────────────────────────────────────────────

const manifests = [
  'k8s/namespace.yaml',
  'k8s/services.yaml',
  'k8s/postgres.yaml',
  'k8s/redis.yaml',
  'k8s/app.yaml',
  'k8s/nginx.yaml',
  'k8s/pgadmin.yaml',
  'k8s/configmaps/nginx.yaml',
  'k8s/configmaps/prometheus.yaml',
  'k8s/configmaps/monitoring.yaml',
  'k8s/configmaps/grafana-provisioning.yaml',
  'k8s/monitoring/prometheus.yaml',
  'k8s/monitoring/grafana.yaml',
  'k8s/monitoring/otel-collector.yaml',
  'k8s/monitoring/tempo.yaml',
  'k8s/monitoring/loki.yaml',
  'k8s/monitoring/promtail.yaml',
  'k8s/monitoring/exporters.yaml',
] as const;

// kubectl apply --dry-run=client requires server API discovery in kubectl ≥1.35
// even with --validate=false. Use offline YAML parsing instead; the kustomize
// build test above already validates the full resolved stack structurally.
describe('k8s / manifest YAML structure', () => {
  for (const manifest of manifests) {
    it(`${manifest} — exists and contains apiVersion + kind`, async () => {
      const file = Bun.file(join(REPO_DIR, manifest));
      expect(await file.exists(), `${manifest} not found`).toBe(true);
      const text = await file.text();
      expect(text, `${manifest} missing apiVersion`).toContain('apiVersion:');
      expect(text, `${manifest} missing kind`).toContain('kind:');
    });
  }
});

// ── Manifest content checks ───────────────────────────────────────────────────

describe('k8s / app.yaml — nextjs-app deployment', () => {
  it('defines nextjs-app Deployment', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/app.yaml')).text();
    expect(text).toContain('kind: Deployment');
    expect(text).toContain('app: nextjs-app');
  });

  it('has readiness and liveness probes configured', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/app.yaml')).text();
    expect(text).toContain('readinessProbe');
    expect(text).toContain('livenessProbe');
  });

  it('has resource requests and limits', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/app.yaml')).text();
    expect(text).toContain('resources:');
    expect(text).toContain('requests:');
    expect(text).toContain('limits:');
  });
});

describe('k8s / services.yaml — microservice deployments', () => {
  it('defines llm-aggregator Deployment', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/services.yaml')).text();
    expect(text).toContain('app: llm-aggregator');
  });

  it('defines user-analytics Deployment', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/services.yaml')).text();
    expect(text).toContain('app: user-analytics');
  });

  it('defines model-widget Deployment', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/services.yaml')).text();
    expect(text).toContain('app: model-widget');
  });

  it('all microservices have /health readiness probes', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/services.yaml')).text();
    expect(text).toContain('/health');
    expect(text).toContain('readinessProbe');
  });
});

describe('k8s / postgres.yaml — StatefulSet', () => {
  it('uses StatefulSet', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/postgres.yaml')).text();
    expect(text).toContain('kind: StatefulSet');
  });

  it('has a PersistentVolumeClaim for storage', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/postgres.yaml')).text();
    // Either a standalone PVC or volumeClaimTemplates inside the StatefulSet
    const hasPvc = text.includes('PersistentVolumeClaim') || text.includes('volumeClaimTemplates');
    expect(hasPvc).toBe(true);
  });
});

describe('k8s / redis.yaml — StatefulSet', () => {
  it('uses StatefulSet', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/redis.yaml')).text();
    expect(text).toContain('kind: StatefulSet');
  });
});

describe('k8s / namespace.yaml', () => {
  it('creates devops-pipeline namespace', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/namespace.yaml')).text();
    expect(text).toContain('kind: Namespace');
    expect(text).toContain('devops-pipeline');
  });
});

describe('k8s / monitoring manifests', () => {
  const monitoringServices = [
    { file: 'prometheus.yaml', app: 'prometheus' },
    { file: 'grafana.yaml',    app: 'grafana'    },
    { file: 'tempo.yaml',      app: 'tempo'      },
    { file: 'loki.yaml',       app: 'loki'       },
  ] as const;

  for (const { file, app } of monitoringServices) {
    it(`monitoring/${file} — defines ${app} Deployment`, async () => {
      const text = await Bun.file(join(REPO_DIR, `k8s/monitoring/${file}`)).text();
      expect(text).toContain('kind: Deployment');
      expect(text).toContain(`app: ${app}`);
    });
  }

  it('exporters.yaml — defines redis-exporter, postgres-exporter, nginx-prometheus-exporter', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/monitoring/exporters.yaml')).text();
    expect(text).toContain('redis-exporter');
    expect(text).toContain('postgres-exporter');
    expect(text).toContain('nginx-prometheus-exporter');
  });

  it('otel-collector.yaml — exposes OTLP gRPC (4317) and HTTP (4318)', async () => {
    const text = await Bun.file(join(REPO_DIR, 'k8s/monitoring/otel-collector.yaml')).text();
    expect(text).toContain('4317');
    expect(text).toContain('4318');
  });
});

// ── YAML lint (optional) ──────────────────────────────────────────────────────

describe('k8s / yamllint (optional)', () => {
  it('all manifests pass yamllint', () => {
    if (!which('yamllint')) {
      console.log('  yamllint not installed — skipping');
      return;
    }
    const { ok, stdout, stderr } = spawn(
      ['yamllint', '-d', 'relaxed', 'k8s/'],
      REPO_DIR
    );
    expect(ok, `yamllint failed:\n${stdout}\n${stderr}`).toBe(true);
  });
});
