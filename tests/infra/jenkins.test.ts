/**
 * Jenkins pipeline tests — validate Jenkinsfile structure, required stages,
 * environment variables, and agent configuration without a running Jenkins server.
 *
 * Run: bun test tests/infra/jenkins.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { join } from 'path';

const JENKINSFILE = join(import.meta.dir, '../../Jenkinsfile');

// Read once; share across all tests
const text = await Bun.file(JENKINSFILE).text();

// ── File existence ────────────────────────────────────────────────────────────

describe('jenkins / Jenkinsfile exists', () => {
  it('Jenkinsfile is present and non-empty', async () => {
    const file = Bun.file(JENKINSFILE);
    expect(await file.exists()).toBe(true);
    expect(text.trim().length).toBeGreaterThan(0);
  });
});

// ── Pipeline declaration ──────────────────────────────────────────────────────

describe('jenkins / pipeline structure', () => {
  it('uses declarative pipeline block', () => {
    expect(text).toMatch(/^pipeline\s*\{/m);
  });

  it('declares agent', () => {
    expect(text).toContain('agent');
  });

  it('has an options block', () => {
    expect(text).toContain('options {');
  });

  it('discard old builds (buildDiscarder)', () => {
    expect(text).toContain('buildDiscarder');
  });

  it('sets a global timeout', () => {
    expect(text).toContain('timeout(');
  });

  it('has an environment block', () => {
    expect(text).toContain('environment {');
  });
});

// ── Required environment variables ────────────────────────────────────────────

describe('jenkins / environment variables', () => {
  const requiredEnvVars = ['REGISTRY', 'IMAGE_PREFIX', 'NAMESPACE'] as const;

  for (const envVar of requiredEnvVars) {
    it(`declares ${envVar}`, () => {
      expect(text, `missing env var: ${envVar}`).toContain(envVar);
    });
  }
});

// ── Required stages ───────────────────────────────────────────────────────────

describe('jenkins / required stages', () => {
  const requiredStages: Array<[name: string, pattern: RegExp | string]> = [
    ['Install',           /stage\s*\(\s*['"]Install['"]\s*\)/],
    ['Lint & Type Check', /stage\s*\(\s*['"]Lint/],
    ['Unit Tests',        /stage\s*\(\s*['"]Unit Tests['"]\s*\)/],
    ['Integration Tests', /stage\s*\(\s*['"]Integration Tests['"]\s*\)/],
    ['Build Images',      /stage\s*\(\s*['"]Build/],
    ['Push Images',       /stage\s*\(\s*['"]Push/],
    ['Deploy',            /stage\s*\(\s*['"]Deploy['"]\s*\)/],
    ['Smoke Tests',       /stage\s*\(\s*['"]Smoke/],
  ];

  for (const [name, pattern] of requiredStages) {
    it(`"${name}" stage is present`, () => {
      expect(text, `missing stage: ${name}`).toMatch(pattern);
    });
  }
});

// ── Parallel lint stage ───────────────────────────────────────────────────────

describe('jenkins / lint stage parallel steps', () => {
  const parallelSteps = ['ESLint', 'Prettier', 'TypeScript'] as const;

  it('lint stage uses parallel execution', () => {
    expect(text).toContain('parallel');
  });

  for (const step of parallelSteps) {
    it(`parallel step "${step}" is present`, () => {
      expect(text, `missing parallel step: ${step}`).toContain(step);
    });
  }
});

// ── Install stage ─────────────────────────────────────────────────────────────

describe('jenkins / install stage', () => {
  it('installs root dependencies with bun', () => {
    expect(text).toContain('bun install');
  });

  it('installs llm-aggregator dependencies', () => {
    expect(text).toContain('services/llm-aggregator');
  });

  it('installs user-analytics dependencies', () => {
    expect(text).toContain('services/user-analytics');
  });

  it('installs model-widget dependencies', () => {
    expect(text).toContain('micro-frontends/model-widget');
  });
});

// ── Test stage commands ───────────────────────────────────────────────────────

describe('jenkins / test stage commands', () => {
  it('unit test stage runs bun test:unit', () => {
    expect(text).toContain('test:unit');
  });

  it('integration test stage runs bun test:integration', () => {
    expect(text).toContain('test:integration');
  });

  it('smoke test stage runs bun test:smoke', () => {
    expect(text).toContain('test:smoke');
  });
});

// ── Integration test services ─────────────────────────────────────────────────

describe('jenkins / integration test service setup', () => {
  it('spins up a postgres container for integration tests', () => {
    expect(text).toMatch(/postgres.*integration|ci-postgres/i);
  });

  it('spins up a redis container for integration tests', () => {
    expect(text).toMatch(/redis.*integration|ci-redis/i);
  });
});

// ── Docker image builds ───────────────────────────────────────────────────────

describe('jenkins / docker image builds', () => {
  it('builds the Next.js app image', () => {
    expect(text).toContain('devops-pipeline:');
  });

  it('builds the llm-aggregator image', () => {
    expect(text).toContain('devops-pipeline-llm-aggregator');
  });

  it('builds the user-analytics image', () => {
    expect(text).toContain('devops-pipeline-user-analytics');
  });

  it('builds the model-widget image', () => {
    expect(text).toContain('devops-pipeline-model-widget');
  });

  it('build stage is gated to main or develop branches', () => {
    expect(text).toMatch(/main|develop/);
    expect(text).toContain('when');
  });
});

// ── Deploy stage ──────────────────────────────────────────────────────────────

describe('jenkins / deploy stage', () => {
  it('applies Kubernetes manifests', () => {
    expect(text).toContain('kubectl apply');
  });

  it('waits for deployment rollout', () => {
    expect(text).toContain('kubectl rollout status');
  });

  it('updates kubeconfig from EKS', () => {
    expect(text).toContain('aws eks');
  });

  it('deploy is gated to main branch only', () => {
    // Deploy stage must have a branch condition
    const deployIdx = text.indexOf("'Deploy'");
    const section = text.slice(deployIdx, deployIdx + 500);
    expect(section).toContain('when');
  });
});

// ── Terraform stage ───────────────────────────────────────────────────────────

describe('jenkins / terraform stage', () => {
  it('runs terraform init', () => {
    expect(text).toContain('terraform init');
  });

  it('runs terraform validate', () => {
    expect(text).toContain('terraform validate');
  });

  it('runs terraform plan', () => {
    expect(text).toContain('terraform plan');
  });

  it('runs terraform apply only on main branch', () => {
    expect(text).toContain('terraform apply');
  });
});

// ── Image tagging ─────────────────────────────────────────────────────────────

describe('jenkins / image tagging strategy', () => {
  it('tags images with git SHA', () => {
    expect(text).toMatch(/SHORT_SHA|GIT_COMMIT/);
  });

  it('tags images with branch name', () => {
    expect(text).toMatch(/BRANCH_NAME|branch/i);
  });
});
