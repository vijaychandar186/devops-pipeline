# Local CI/CD Testing

This guide covers the five local testing tools available in this project. They let you validate
workflows, manifests, and Ansible roles without pushing to a remote CI system.

---

## Table of Contents

1. [act — GitHub Actions locally](#act--github-actions-locally)
2. [Jenkins — local container](#jenkins--local-container)
3. [LocalStack — fake AWS for Terraform](#localstack--fake-aws-for-terraform)
4. [kind — Kubernetes in Docker](#kind--kubernetes-in-docker)
5. [Molecule — Ansible role testing](#molecule--ansible-role-testing)

---

## act — GitHub Actions locally

Runs GitHub Actions workflows on your machine using Docker containers.

### Installation

```bash
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Configuration files

| File | Purpose |
|------|---------|
| `.actrc` | Points act at `.act.secrets` and `.act.env` |
| `.act.secrets.example` | Template — copy to `.act.secrets` and fill in values |
| `.act.env.example` | Template — copy to `.act.env` and fill in values |

```bash
cp .act.secrets.example .act.secrets
cp .act.env.example .act.env
# Edit both files with your values before running act
```

### Quick start

```bash
make act-ci          # Run the full ci.yml workflow
make act-ci-fast     # Run ci.yml, skipping slow steps
make act-terraform   # Run terraform.yml
make act-stress      # Run stress.yml
make act-list        # List all available workflows and jobs
```

### What it covers

- `ci.yml` — lint, unit tests, integration tests, image builds
- `terraform.yml` — `terraform plan` / `apply` stages
- `stress.yml` — k6 stress test workflow

### Tips

- Use `act-ci-fast` during development to skip slow steps (image builds, pushes).
- Secrets in `.act.secrets` are never committed — the file is `.gitignore`d.
- `act-list` shows job names you can target with `act -j <job>` for even faster iteration.

---

## Jenkins — local container

Runs a Jenkins LTS container with the full Jenkinsfile pipeline. Useful for testing declarative
pipeline syntax and stage ordering without a remote Jenkins server.

### Files

| File | Purpose |
|------|---------|
| `docker-compose.jenkins.yml` | Jenkins LTS service, Docker socket mount, workspace volume |
| `jenkins/Dockerfile` | Installs bun, Docker CLI, kubectl, and all required plugins |
| `jenkins/plugins.txt` | Plugin list: pipeline, blueocean, ansicolor, credentials-binding, docker-workflow, configuration-as-code |
| `jenkins/casc.yaml` | JCasC config: creates admin/admin login and auto-creates the `devops-pipeline` pipeline job |

### Quick start

```bash
make jenkins-up      # Start Jenkins at http://localhost:8080
make jenkins-logs    # Tail container logs (watch for "Jenkins is fully up and ready")
make jenkins-down    # Stop Jenkins
make jenkins-clean   # Stop and remove all Jenkins data (full reset)
```

Access Jenkins at **<http://localhost:8080>** — login with `admin` / `admin`.

### What it covers

- Full declarative `Jenkinsfile` execution
- Plugin compatibility (BlueOcean, AnsiColor, Docker Workflow, Credentials Binding)
- JCasC auto-configuration of the pipeline job

### Tips

- Use the **Replay** button in the Jenkins UI to edit and re-run a pipeline build without
  committing changes. This is the fastest way to iterate on `Jenkinsfile` changes.
- The local repo is mounted into the Jenkins workspace so the job runs against your working tree.
- On first start Jenkins may take 2–3 minutes to download and install plugins. Watch
  `make jenkins-logs` and wait for "Jenkins is fully up and ready" before triggering a build.

---

## LocalStack — fake AWS for Terraform

Runs a LocalStack v3 container that emulates AWS APIs locally, allowing `terraform plan` and
`terraform apply` without a real AWS account.

### Installation

```bash
pip install terraform-local   # provides the `tflocal` wrapper
```

### Files

| File | Purpose |
|------|---------|
| `docker-compose.localstack.yml` | LocalStack v3 with VPC, EC2, RDS, ElastiCache, IAM, STS |
| `terraform/localstack/main.tf` | Tests VPC + RDS + ElastiCache modules against LocalStack |

### Quick start

```bash
make localstack-up       # Start LocalStack
make tf-local            # Init → plan → apply in one shot
make tf-local-destroy    # Destroy all resources
make localstack-down     # Stop LocalStack
```

Or run steps individually:

```bash
make tf-local-init       # tflocal init
make tf-local-plan       # tflocal plan
make tf-local-apply      # tflocal apply
```

### What it covers

- VPC module (subnets, route tables, security groups)
- RDS module (Postgres instance)
- ElastiCache module (Redis cluster)

### Limitations

- **EKS is not supported** in LocalStack Community edition (Pro only). The
  `terraform/localstack/main.tf` intentionally excludes the EKS module.
- IAM policies are emulated but not enforced — permission errors that occur in real AWS may not
  surface locally.
- Some advanced RDS / ElastiCache parameters are ignored by LocalStack.

---

## kind — Kubernetes in Docker

Creates a real, single-node Kubernetes cluster inside Docker containers, allowing you to run
`kubectl apply` against an actual cluster API without any cloud provider.

### Installation

```bash
brew install kind
# or
go install sigs.k8s.io/kind@latest
```

### Configuration file

| File | Purpose |
|------|---------|
| `kind-config.yaml` | 1 control-plane + 1 worker; host port mappings 8080→80, 8443→443 |

### Quick start

```bash
make kind-up         # Create the kind cluster
make kind-deploy     # kubectl apply -k k8s/ against the kind cluster
make kind-status     # Show pod status in the devops-pipeline namespace
make kind-down       # Delete the kind cluster
make kind-reset      # Delete and recreate the cluster
```

### What it covers

- Full `kubectl apply -k k8s/` kustomize deployment
- All Kubernetes manifests: Deployments, Services, ConfigMaps, Secrets, namespace
- Confirms manifests are syntactically valid and schedulable

### Tips

- Run `make kind-status` after `make kind-deploy` to check that all pods reach `Running`.
- The cluster uses port mappings 8080→80 and 8443→443 so you can hit services at
  `http://localhost:8080` without any extra port-forwarding.
- Images must be pre-loaded into kind or pulled from a registry — local images not automatically
  available. Use `kind load docker-image <image>` if testing custom images.

---

## Molecule — Ansible role testing

Tests individual Ansible roles in Docker containers running Ubuntu 22.04, giving near-identical
behaviour to a real VM without the overhead.

### Installation

```bash
pip install molecule molecule-docker
ansible-galaxy collection install community.docker community.general
```

One-time patch to enable `init: true` container support in molecule-docker:

```bash
python3 -c "
import site, os
for d in site.getsitepackages():
    p = os.path.join(d, 'molecule_docker/playbooks/create.yml')
    if os.path.exists(p):
        txt = open(p).read()
        if 'init:' not in txt:
            txt = txt.replace('        cgroupns_mode:', '        init: \"{{ item.init | default(omit) }}\"\n        cgroupns_mode:')
            open(p, 'w').write(txt)
            print('patched', p)
        break
"
```

### Files

| Path | Purpose |
|------|---------|
| `ansible/roles/common/molecule/default/molecule.yml` | Molecule config for the `common` role |
| `ansible/roles/common/molecule/default/converge.yml` | Applies the `common` role to the test container |
| `ansible/roles/common/molecule/default/verify.yml` | Assertions run after converge |
| `ansible/roles/docker/molecule/default/molecule.yml` | Molecule config for the `docker` role |
| `ansible/roles/docker/molecule/default/converge.yml` | Applies the `docker` role |
| `ansible/roles/docker/molecule/default/verify.yml` | Assertions run after converge |

Both roles use `geerlingguy/docker-ubuntu2204-ansible` as the test image. Containers start with
`sleep infinity` and tini (`init: true`) as PID 1.

### Quick start

```bash
make molecule-common   # Test the common role (UFW, SSH hardening, unattended upgrades)
make molecule-docker   # Test the docker role (Docker CE, log rotation)
make molecule-all      # Test all roles
```

### What it covers

- `common` role: package updates, UFW firewall rules, unattended security upgrades  
  Installs: curl, git, jq, ca-certificates; verifies via verify.yml assertions
- `docker` role: Docker CE installation (GPG key + apt repo), Compose plugin, log rotation config  
  Verifies: docker-ce installed, `/etc/docker/daemon.json` created with log rotation settings

### Codespaces / DooD notes

This project runs in Docker-outside-of-Docker (DooD) — the devcontainer talks to the host Docker
daemon via `/var/run/docker.sock`. Two workarounds are baked into the molecule configuration:

1. **`community.docker.docker_api` connection plugin** — The default `community.docker.docker`
   connection plugin uses the `docker exec` CLI, which does not block correctly when the docker
   client (v29) and daemon (v24) versions differ. The `docker_api` plugin communicates directly
   with the Docker daemon REST API via the socket, bypassing the CLI version mismatch entirely.
   Set in `molecule.yml` as `ansible_connection: community.docker.docker_api`.

2. **`init: true` + `sleep infinity`** — Containers run tini as PID 1 (required for apt to work
   in a pipe context) and keep alive with `sleep infinity` instead of systemd.

### Expected failures (ignored)

The following tasks fail in container environments and are suppressed with `ignore_errors: true`:

| Role | Task | Reason |
|------|------|--------|
| `common` | Set timezone to UTC | `tzdata` not installed in base image |
| `common` | Configure UFW — allow SSH | OpenSSH app profile not present |
| `common` | Disable root SSH login | No `/etc/ssh/sshd_config` (no sshd daemon) |
| `docker` | Enable and start Docker service | No systemd; DooD containers don't run dockerd |
| `docker` | Open HTTP/HTTPS in UFW | UFW not installed (no network filtering in containers) |

The `docker` role test omits the idempotence step for the same reason — `service: state=started`
always reports changed when dockerd cannot persist between plays.

### Tips

- Each `make molecule-*` run executes the full Molecule lifecycle: `create` → `converge` →
  `verify` → `destroy`. Failed runs leave the container running for inspection; clean up with
  `molecule destroy` from the role directory.
- The `ANSIBLE_ROLES_PATH` environment variable is set in the Makefile targets to satisfy
  Ansible's world-writable directory check in Codespaces.
- To run a single Molecule stage during development (e.g. skip destroy for debugging):

  ```bash
  cd ansible/roles/common
  molecule converge
  molecule verify
  molecule destroy
  ```
