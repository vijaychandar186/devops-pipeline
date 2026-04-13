/**
 * Ansible infrastructure tests — validate playbook syntax, role structure,
 * and optionally run ansible-lint.
 *
 * These tests run entirely offline (no SSH connections made).
 * ansible-playbook must be in PATH.  ansible-lint is optional — tests skip
 * gracefully when it is not installed.
 *
 * Run: bun test tests/infra/ansible.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { join } from 'path';

const ANSIBLE_DIR = join(import.meta.dir, '../../ansible');

function which(bin: string): boolean {
  const p = Bun.spawnSync(['which', bin], { stdout: 'pipe', stderr: 'pipe' });
  return p.exitCode === 0;
}

function spawn(
  cmd: string[],
  cwd: string,
  env?: Record<string, string>
): { ok: boolean; stdout: string; stderr: string } {
  const p = Bun.spawnSync(cmd, {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    env: env ? { ...process.env, ...env } : undefined,
  });
  return {
    ok: p.exitCode === 0,
    stdout: p.stdout.toString().trim(),
    stderr: p.stderr.toString().trim()
  };
}

// ── Prerequisites (optional — tests skip gracefully when ansible absent) ──────

const ansibleAvailable = which('ansible-playbook');

describe('ansible / prerequisites', () => {
  it('ansible-playbook is installed', () => {
    if (!ansibleAvailable) {
      console.log('  ansible-playbook not found — CLI-dependent tests will be skipped');
      return;
    }
    expect(ansibleAvailable).toBe(true);
  });
});

// ── Playbook syntax checks ────────────────────────────────────────────────────

const playbooks = ['provision.yml', 'deploy.yml', 'deploy-k8s.yml'] as const;

describe('ansible / playbook syntax-check', () => {
  for (const playbook of playbooks) {
    it(`${playbook} — passes --syntax-check`, () => {
      if (!ansibleAvailable) { console.log('  skipped (ansible-playbook not installed)'); return; }
      // Pass ANSIBLE_ROLES_PATH explicitly so the test works even when
      // the workspace directory is world-writable (which causes Ansible to
      // ignore ansible.cfg for security reasons, e.g. in Codespaces).
      const { ok, stderr } = spawn(
        ['ansible-playbook', '--syntax-check', `playbooks/${playbook}`],
        ANSIBLE_DIR,
        { ANSIBLE_ROLES_PATH: join(ANSIBLE_DIR, 'roles') }
      );
      expect(ok, `syntax-check failed for ${playbook}:\n${stderr}`).toBe(true);
    });
  }
});

// ── Inventory structure ───────────────────────────────────────────────────────

describe('ansible / inventory', () => {
  it('inventory/hosts.yml exists and is a valid YAML file', async () => {
    const file = Bun.file(join(ANSIBLE_DIR, 'inventory/hosts.yml'));
    expect(await file.exists()).toBe(true);
    const text = await file.text();
    expect(text.length).toBeGreaterThan(0);
    // Must define the expected groups
    expect(text).toContain('app_servers');
  });

  it('ansible --list-hosts resolves inventory groups', () => {
    if (!which('ansible')) { console.log('  skipped (ansible not installed)'); return; }
    const { ok, stdout, stderr } = spawn(
      ['ansible', 'all', '--list-hosts'],
      ANSIBLE_DIR
    );
    expect(ok, `list-hosts failed: ${stderr}`).toBe(true);
    expect(stdout).toContain('hosts');
  });
});

// ── Role structure ────────────────────────────────────────────────────────────

describe('ansible / role structure', () => {
  const roles = ['common', 'docker', 'app', 'kubectl'] as const;

  for (const role of roles) {
    it(`roles/${role}/tasks/main.yml — exists and is non-empty`, async () => {
      const file = Bun.file(join(ANSIBLE_DIR, `roles/${role}/tasks/main.yml`));
      expect(await file.exists(), `roles/${role}/tasks/main.yml not found`).toBe(true);
      const text = await file.text();
      expect(text.trim().length).toBeGreaterThan(0);
    });
  }

  it('roles/common/handlers/main.yml — exists', async () => {
    const file = Bun.file(join(ANSIBLE_DIR, 'roles/common/handlers/main.yml'));
    expect(await file.exists()).toBe(true);
  });

  it('roles/docker/handlers/main.yml — exists', async () => {
    const file = Bun.file(join(ANSIBLE_DIR, 'roles/docker/handlers/main.yml'));
    expect(await file.exists()).toBe(true);
  });

  it('roles/app/templates/env.production.j2 — exists', async () => {
    const file = Bun.file(join(ANSIBLE_DIR, 'roles/app/templates/env.production.j2'));
    expect(await file.exists()).toBe(true);
  });
});

// ── Group variables ───────────────────────────────────────────────────────────

describe('ansible / group_vars', () => {
  it('group_vars/all.yml — contains required keys', async () => {
    const file = Bun.file(join(ANSIBLE_DIR, 'group_vars/all.yml'));
    expect(await file.exists()).toBe(true);
    const text = await file.text();
    expect(text).toContain('docker_version');
    expect(text).toContain('aws_region');
  });

  it('group_vars/app_servers.yml — exists', async () => {
    const file = Bun.file(join(ANSIBLE_DIR, 'group_vars/app_servers.yml'));
    expect(await file.exists()).toBe(true);
  });
});

// ── Playbook content checks ───────────────────────────────────────────────────

describe('ansible / playbook content', () => {
  it('provision.yml — applies common and docker roles', async () => {
    const text = await Bun.file(join(ANSIBLE_DIR, 'playbooks/provision.yml')).text();
    expect(text).toContain('common');
    expect(text).toContain('docker');
  });

  it('deploy.yml — applies app role', async () => {
    const text = await Bun.file(join(ANSIBLE_DIR, 'playbooks/deploy.yml')).text();
    expect(text).toContain('app');
  });

  it('deploy-k8s.yml — applies kubectl role', async () => {
    const text = await Bun.file(join(ANSIBLE_DIR, 'playbooks/deploy-k8s.yml')).text();
    expect(text).toContain('kubectl');
  });
});

// ── ansible-lint (optional) ───────────────────────────────────────────────────

describe('ansible / lint (requires ansible-lint)', () => {
  it('provision.yml — passes ansible-lint', () => {
    if (!which('ansible-lint')) {
      console.log('  ansible-lint not installed — skipping');
      return;
    }
    const { ok, stdout, stderr } = spawn(
      ['ansible-lint', 'playbooks/provision.yml'],
      ANSIBLE_DIR
    );
    expect(ok, `ansible-lint failed:\n${stdout}\n${stderr}`).toBe(true);
  });

  it('deploy.yml — passes ansible-lint', () => {
    if (!which('ansible-lint')) {
      console.log('  ansible-lint not installed — skipping');
      return;
    }
    const { ok, stdout, stderr } = spawn(
      ['ansible-lint', 'playbooks/deploy.yml'],
      ANSIBLE_DIR
    );
    expect(ok, `ansible-lint failed:\n${stdout}\n${stderr}`).toBe(true);
  });
});
