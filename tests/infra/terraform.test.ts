/**
 * Terraform infrastructure tests — validate HCL syntax, formatting, and
 * module structure without connecting to AWS.
 *
 * Stages:
 *   1. terraform fmt -check  — format check (no state, no providers needed)
 *   2. terraform validate    — full HCL validation (requires: terraform init -backend=false)
 *
 * Run: bun test tests/infra/terraform.test.ts
 *
 * Note: terraform validate initialises providers locally (-backend=false).
 * It does NOT create any real AWS resources.
 */
import { describe, it, expect } from 'bun:test';
import { join } from 'path';

const TF_DIR = join(import.meta.dir, '../../terraform');

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

// ── Prerequisites (optional — tests skip gracefully when terraform absent) ────

const tfAvailable = which('terraform');

describe('terraform / prerequisites', () => {
  it('terraform is installed', () => {
    if (!tfAvailable) {
      console.log('  terraform not found — CLI-dependent tests will be skipped');
      return;
    }
    expect(tfAvailable).toBe(true);
  });

  it('terraform version is >= 1.6', () => {
    if (!tfAvailable) { console.log('  skipped (terraform not installed)'); return; }
    const { ok, stdout } = spawn(['terraform', 'version', '-json'], TF_DIR);
    expect(ok).toBe(true);
    const data = JSON.parse(stdout) as { terraform_version: string };
    const [major, minor] = data.terraform_version.split('.').map(Number);
    expect(major).toBeGreaterThanOrEqual(1);
    if (major === 1) expect(minor).toBeGreaterThanOrEqual(6);
  });
});

// ── Format check ──────────────────────────────────────────────────────────────

describe('terraform / fmt', () => {
  it('root module — all .tf files are formatted (terraform fmt -check)', () => {
    if (!tfAvailable) { console.log('  skipped (terraform not installed)'); return; }
    const { ok, stdout, stderr } = spawn(
      ['terraform', 'fmt', '-check', '-recursive'],
      TF_DIR
    );
    expect(ok, `terraform fmt -check found unformatted files:\n${stdout}\n${stderr}`).toBe(true);
  });
});

// ── File structure ────────────────────────────────────────────────────────────

describe('terraform / file structure', () => {
  const expectedFiles = [
    'main.tf',
    'variables.tf',
    'outputs.tf',
    'terraform.tfvars.example',
  ] as const;

  for (const file of expectedFiles) {
    it(`${file} — exists`, async () => {
      const f = Bun.file(join(TF_DIR, file));
      expect(await f.exists(), `${file} not found`).toBe(true);
    });
  }

  const modules = ['vpc', 'eks', 'rds', 'elasticache'] as const;
  for (const mod of modules) {
    it(`modules/${mod}/ — has main.tf, variables.tf, outputs.tf`, async () => {
      for (const file of ['main.tf', 'variables.tf', 'outputs.tf']) {
        const f = Bun.file(join(TF_DIR, `modules/${mod}/${file}`));
        expect(await f.exists(), `modules/${mod}/${file} not found`).toBe(true);
      }
    });
  }
});

// ── Variable declarations ─────────────────────────────────────────────────────

describe('terraform / variables', () => {
  it('variables.tf — declares required variables', async () => {
    const text = await Bun.file(join(TF_DIR, 'variables.tf')).text();
    for (const v of ['project', 'environment', 'region', 'eks_cluster_version']) {
      expect(text, `missing variable: ${v}`).toContain(`"${v}"`);
    }
  });

  it('terraform.tfvars.example — provides example values', async () => {
    const text = await Bun.file(join(TF_DIR, 'terraform.tfvars.example')).text();
    expect(text.trim().length).toBeGreaterThan(0);
  });
});

// ── Module content checks ─────────────────────────────────────────────────────

describe('terraform / modules', () => {
  it('modules/vpc/main.tf — defines aws_vpc resource', async () => {
    const text = await Bun.file(join(TF_DIR, 'modules/vpc/main.tf')).text();
    expect(text).toContain('aws_vpc');
  });

  it('modules/eks/main.tf — defines aws_eks_cluster resource', async () => {
    const text = await Bun.file(join(TF_DIR, 'modules/eks/main.tf')).text();
    expect(text).toContain('aws_eks_cluster');
  });

  it('modules/rds/main.tf — defines aws_db_instance resource', async () => {
    const text = await Bun.file(join(TF_DIR, 'modules/rds/main.tf')).text();
    expect(text).toContain('aws_db_instance');
  });

  it('modules/elasticache/main.tf — defines aws_elasticache_replication_group or cluster', async () => {
    const text = await Bun.file(join(TF_DIR, 'modules/elasticache/main.tf')).text();
    expect(text).toMatch(/aws_elasticache_(replication_group|cluster)/);
  });

  it('modules/eks/outputs.tf — exports cluster_endpoint', async () => {
    const text = await Bun.file(join(TF_DIR, 'modules/eks/outputs.tf')).text();
    expect(text).toContain('cluster_endpoint');
  });
});

// ── validate (requires init) ──────────────────────────────────────────────────

describe('terraform / validate', () => {
  it('terraform init -backend=false — downloads providers', () => {
    if (!tfAvailable) { console.log('  skipped (terraform not installed)'); return; }
    const { ok, stderr } = spawn(
      ['terraform', 'init', '-backend=false', '-input=false'],
      TF_DIR
    );
    expect(ok, `terraform init failed:\n${stderr}`).toBe(true);
  }, 120_000); // provider download can take up to 2 min on cold cache

  it('terraform validate — HCL is valid', () => {
    if (!tfAvailable) { console.log('  skipped (terraform not installed)'); return; }
    const { ok, stdout, stderr } = spawn(
      ['terraform', 'validate', '-json'],
      TF_DIR
    );
    if (!ok) {
      try {
        const result = JSON.parse(stdout) as { valid: boolean; error_count: number; diagnostics: unknown[] };
        expect(result.valid, `validate errors:\n${JSON.stringify(result.diagnostics, null, 2)}`).toBe(true);
      } catch {
        expect(ok, `terraform validate failed:\n${stderr}`).toBe(true);
      }
    }
    expect(ok).toBe(true);
  }, 30_000);
});
