# DevOps Pipeline — LLM Analytics Platform

A production-grade, cloud-native LLM analytics platform built with Next.js. Ships with a full
microservices architecture, observability stack, Kubernetes deployment, Terraform-managed AWS
infrastructure, Ansible automation, a unified Makefile task runner, and dual CI/CD via Jenkins and
GitHub Actions.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Makefile Reference](#makefile-reference)
- [Development](#development)
- [Production (Docker Compose)](#production-docker-compose)
- [Kubernetes](#kubernetes)
- [Infrastructure (Terraform)](#infrastructure-terraform)
- [Ansible Automation](#ansible-automation)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [CI/CD Pipelines](#cicd-pipelines)
- [Observability](#observability)
- [Services & API Reference](#services--api-reference)
- [Environment Variables](#environment-variables)
- [Auth Setup](#auth-setup)
- [Sentry Setup](#sentry-setup)
- [Port Reference](#port-reference)
- [Security](#security)
- [Changelog](#changelog)

---

## Architecture Overview

```text
Internet
   │
   ▼
nginx (reverse proxy — port 80)
   ├── /               → nextjs-app      :3000  (main dashboard)
   ├── /api/models     → llm-aggregator  :4001  (HuggingFace proxy + Redis cache)
   ├── /api/analytics  → user-analytics  :4002  (event tracking + preferences)
   └── /widget/        → model-widget    :80    (Vite/React micro frontend)

Admin / Observability (direct ports — not proxied through nginx)
   ├── Grafana         :3001  (dashboards — admin only)
   ├── Prometheus      :9090  (metrics — admin only)
   └── pgAdmin         :5050  (database UI — admin only)

Data Layer
   ├── PostgreSQL 16   (app db, grafana state, user-analytics)
   └── Redis 8         (llm-aggregator response cache — 5 min TTL)

Observability Pipeline
   ├── OTel Collector  ──→  Tempo (traces)
   │                   ──→  Prometheus (metrics)
   ├── Prometheus      ←── scrapes /metrics on every service + exporters
   ├── Promtail        ──→  Loki (container logs from /var/log/pods/)
   └── Exporters            postgres-exporter · redis-exporter · nginx-exporter

CI/CD
   ├── GitHub Actions  (cloud — ci.yml / cd.yml / terraform.yml / stress.yml)
   └── Jenkins         (self-hosted — Jenkinsfile)

Infrastructure (AWS)
   ├── EKS             (Kubernetes cluster, managed node group)
   ├── VPC             (3 public + 3 private subnets, NAT gateways)
   ├── RDS             (PostgreSQL 16, db.t3.micro, 7-day backups)
   └── ElastiCache     (Redis 7, 2-node replication group, TLS + auth)
```

---

## Tech Stack

### Application

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | Bun |
| Database | PostgreSQL 16 + Prisma ORM 7 |
| Cache | Redis 8 |
| Auth | NextAuth.js v5 (GitHub OAuth) |
| Styling | Tailwind CSS 4 + Radix UI |
| Error Tracking | Sentry (`@sentry/nextjs`) |

### Microservices

| Service | Stack | Port |
|---------|-------|------|
| llm-aggregator | Bun + Express + Redis | 4001 |
| user-analytics | Bun + Express + PostgreSQL | 4002 |
| model-widget | Vite + React (micro frontend) | 5174 dev / 80 prod |

### Infrastructure & DevOps

| Tool | Purpose |
|------|---------|
| Docker + Docker Compose | Container runtime — local dev and production |
| Kubernetes (EKS) | Container orchestration |
| Terraform | AWS infrastructure as code |
| Ansible | Server provisioning and deployment automation |
| Make | Unified developer task runner (`Makefile`) |
| Jenkins | Self-hosted CI/CD (`Jenkinsfile`) |
| GitHub Actions | Cloud CI/CD (`.github/workflows/`) |
| k6 | Stress and load testing |

### Observability

| Tool | Role |
|------|------|
| Prometheus | Metrics collection and storage |
| Grafana | Dashboards and visualisation |
| Grafana Tempo | Distributed tracing |
| Grafana Loki | Log aggregation |
| OTel Collector | Unified telemetry ingestion point |
| Promtail | Container log shipping to Loki |

### Code Quality

| Tool | Role |
|------|------|
| ESLint | JavaScript / TypeScript linting |
| Prettier | Code formatting |
| TypeScript | Static type checking (`tsc --noEmit`) |
| markdownlint-cli2 | Markdown consistency (`.markdownlint-cli2.yaml`) |
| codespell | Spell checking across source and docs (`.codespellrc`) |
| git-cliff | Automated changelog generation from conventional commits (`cliff.toml`) |

---

## Prerequisites

### Required for local development

| Tool | Version | Install |
|------|---------|---------|
| [Bun](https://bun.sh) | ≥ 1.1 | `curl -fsSL https://bun.sh/install \| bash` |
| [Docker](https://docs.docker.com/get-docker/) | ≥ 27 | docker.com/get-docker |
| [Docker Compose](https://docs.docker.com/compose/) | v2 plugin | included with Docker Desktop |
| [Make](https://www.gnu.org/software/make/) | ≥ 4 | pre-installed on Linux; `brew install make` on macOS |

### Required for infrastructure and deployment

| Tool | Version | Install |
|------|---------|---------|
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | ≥ 1.31 | kubernetes.io/docs/tasks/tools |
| [Terraform](https://developer.hashicorp.com/terraform/install) | ≥ 1.6 | `brew install terraform` |
| [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/) | ≥ 9 | `pip install ansible` |
| [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) | v2 | aws.amazon.com/cli |
| [Jenkins](https://www.jenkins.io/doc/book/installing/) | ≥ 2.440 LTS | jenkins.io/doc/book/installing |

### Required for local CI testing

| Tool | Install |
|------|---------|
| [act](https://github.com/nektos/act) | `curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh \| sudo bash` |
| [kind](https://kind.sigs.k8s.io/) | `brew install kind` or `go install sigs.k8s.io/kind@latest` |
| [terraform-local](https://github.com/localstack/terraform-local) | `pip install terraform-local` |
| [molecule](https://ansible.readthedocs.io/projects/molecule/) | `pip install molecule molecule-docker` + `ansible-galaxy collection install community.docker community.general` |

### Required for stress testing and quality tooling

| Tool | Version | Install |
|------|---------|---------|
| [k6](https://k6.io/docs/get-started/installation/) | latest | `brew install k6` |
| [codespell](https://github.com/codespell-project/codespell) | latest | `pip install codespell` |
| [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) | latest | `bunx markdownlint-cli2` (zero-install via bunx) |
| [git-cliff](https://git-cliff.org/) | latest | `brew install git-cliff` — optional, only to regenerate `CHANGELOG.md` |

---

## Project Structure

```text
devops-pipeline/
├── src/                            # Next.js application source
│   ├── app/                        # App Router pages and layouts
│   └── lib/                        # Auth, DB, and shared utilities
│
├── prisma/                         # Prisma schema and migrations
│
├── services/
│   ├── llm-aggregator/             # Microservice: HuggingFace API + Redis cache
│   └── user-analytics/             # Microservice: event tracking + preferences
│
├── micro-frontends/
│   └── model-widget/               # Standalone Vite/React model card explorer
│
├── monitoring/                     # Observability config
│   ├── prometheus.yml
│   ├── tempo.yml
│   ├── loki.yml
│   ├── otel-collector.yml
│   ├── promtail.yml
│   ├── postgres_exporter.yml
│   └── grafana/provisioning/       # Grafana datasources + dashboard providers
│
├── k8s/                            # Kubernetes manifests (kubectl apply -k k8s/)
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── secrets.yaml                # Fill in before applying
│   ├── configmaps/
│   ├── monitoring/
│   └── *.yaml                      # Per-service deployments
│
├── terraform/                      # AWS infrastructure (EKS, VPC, RDS, ElastiCache)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── modules/
│       ├── vpc/
│       ├── eks/
│       ├── rds/
│       └── elasticache/
│
├── ansible/                        # Server provisioning and deployment automation
│   ├── ansible.cfg
│   ├── inventory/
│   ├── group_vars/
│   ├── playbooks/
│   └── roles/
│
├── tests/
│   ├── unit/                       # Fully mocked — no external deps
│   ├── integration/                # Needs Postgres + Redis + running services
│   ├── smoke/                      # Reachability checks post-deploy
│   └── stress/                     # k6 load test scripts
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint → test → build → push images
│       ├── cd.yml                  # Deploy to EKS on CI success
│       ├── terraform.yml           # Plan on PR, apply on merge to main
│       └── stress.yml              # Nightly k6 run at 02:00 UTC
│
├── docs/                           # Supplementary documentation
│
├── .devcontainer/                  # VS Code dev container config
├── .vscode/                        # Editor settings and recommended extensions
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── nginx.conf                      # Production nginx config
├── nginx.dev.conf                  # Development nginx config
├── Dockerfile.dev
├── Dockerfile.prod
├── Makefile                        # Unified developer task runner
├── Jenkinsfile                     # Declarative Jenkins pipeline
├── CHANGELOG.md                    # Version history (auto-generated by git-cliff)
├── SECURITY.md                     # Vulnerability reporting policy
├── cliff.toml                      # git-cliff changelog config
├── .codespellrc                    # codespell settings
├── .codespellignore                # codespell path exclusions
├── .markdownlint-cli2.yaml         # Markdown linting rules
├── instrumentation.ts              # Sentry server/edge registration
├── instrumentation-client.ts       # Sentry browser init
├── sentry.server.config.ts
├── sentry.edge.config.ts
└── next.config.ts                  # Wrapped with withSentryConfig()
```

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/vijaychandar186/devops-pipeline.git
cd devops-pipeline

# 2. Install all dependencies (root + microservices)
make install

# 3. Create the local env file and fill in values (see Auth Setup)
make env

# 4. Start the full dev stack
make dev
```

After startup:

| Service | URL |
|---------|-----|
| App (direct) | <http://localhost:3000> |
| App (via nginx) | <http://localhost:80> |
| llm-aggregator | <http://localhost:4001> |
| user-analytics | <http://localhost:4002> |
| model-widget | <http://localhost:5174> |
| pgAdmin | <http://localhost:5050> |
| Prisma Studio | <http://localhost:5555> |
| Redis Commander | <http://localhost:8082> |
| Grafana | <http://localhost:3001> |
| Prometheus | <http://localhost:9090> |

---

## Makefile Reference

Run `make help` to print all targets with descriptions.

### Setup

| Target | What it does |
|--------|-------------|
| `make install` | `bun install` for root, both microservices, and model-widget |
| `make env` | Copies `.env.example` → `.env.local` (skips if already exists) |

### Code quality

| Target | What it does |
|--------|-------------|
| `make lint` | ESLint |
| `make lint-fix` | ESLint with auto-fix |
| `make format` | Prettier (write) |
| `make format-check` | Prettier (check only) |
| `make typecheck` | `tsc --noEmit` |
| `make lint-docs` | markdownlint-cli2 over all `.md` files |
| `make lint-spell` | codespell over source and docs |
| `make spell-fix` | codespell with `--write-changes` |
| `make changelog` | Regenerate `CHANGELOG.md` via git-cliff |
| `make check` | All of the above in one shot |

### Testing

| Target | What it does |
|--------|-------------|
| `make test-unit` | Unit tests — no external deps |
| `make test-integration` | Integration tests — needs Postgres + Redis + services |
| `make test-smoke` | Smoke tests — reads `APP_URL` / `*_URL` env vars |
| `make test-all` | All three suites |
| `make stress` | k6 stress tests; results written to `results/` |
| `make ci` | `check` + `test-unit` + `test-integration` — full local CI run |
| `make test-infra` | Validate Ansible, K8s, Terraform, Jenkinsfile (offline) |
| `make test-infra-k8s` | K8s manifest validation only |
| `make test-infra-terraform` | Terraform fmt + validate |
| `make test-infra-ansible` | Ansible syntax-check |
| `make test-infra-jenkins` | Jenkinsfile declarative lint |

### Docker & local dev

| Target | What it does |
|--------|-------------|
| `make dev` | `docker compose -f docker-compose.dev.yml up` |
| `make dev-build` | Rebuild images and start the dev stack |
| `make dev-build-nocache` | Rebuild all images from scratch (no cache) and start |
| `make dev-down` | Stop and remove dev containers |
| `make dev-logs` | Tail all dev stack logs |
| `make prod-up` | Start the production stack (detached) |
| `make prod-down` | Stop the production stack |
| `make prod-ps` | Show production container status |
| `make prisma-migrate` | `prisma migrate dev` |
| `make prisma-generate` | Regenerate Prisma client |
| `make prisma-studio` | Open Prisma Studio on port 5555 |

### Building and pushing images

| Target | What it does |
|--------|-------------|
| `make build` | Build all four Docker images |
| `make build-app` | Build the Next.js app image only |
| `make build-llm-aggregator` | Build the llm-aggregator image |
| `make build-user-analytics` | Build the user-analytics image |
| `make build-model-widget` | Build the model-widget image |
| `make push` | Push all images to GHCR (login first) |
| `make build-push` | Build then push |

Override the default `latest` tag with `TAG=`:

```bash
make build-push TAG=sha-$(git rev-parse --short HEAD)
```

### Kubernetes

| Target | What it does |
|--------|-------------|
| `make k8s-apply` | `kubectl apply -k k8s/` |
| `make k8s-status` | Pod status in the `devops-pipeline` namespace |
| `make k8s-rollout` | Wait for all four deployments to complete rollout |
| `make k8s-restart` | Rolling restart of all deployments |
| `make k8s-logs` | Tail `nextjs-app` pod logs |
| `make kubeconfig` | Update local kubeconfig for the EKS cluster |

### Terraform

| Target | What it does |
|--------|-------------|
| `make tf-init` | `terraform init` |
| `make tf-fmt` | `terraform fmt -recursive` |
| `make tf-validate` | `terraform validate` |
| `make tf-plan` | Plan — reads `TF_DB_PASSWORD` and `TF_REDIS_AUTH_TOKEN` env vars |
| `make tf-apply` | Apply the saved `tfplan` |
| `make tf-destroy` | Destroy all resources (prompts for confirmation) |
| `make tf-output` | Print Terraform outputs |

### Ansible

| Target | What it does |
|--------|-------------|
| `make ansible-provision` | Provision a fresh Ubuntu server |
| `make ansible-deploy` | Deploy the app stack via Docker Compose on remote hosts |
| `make ansible-deploy-k8s` | Deploy K8s manifests from a bastion host |
| `make ansible-ping` | Ping all inventory hosts |

### Local CI

#### act (GitHub Actions locally)

| Target | What it does |
|--------|-------------|
| `make act-ci` | Run the full `ci.yml` workflow locally via act |
| `make act-ci-fast` | Run `ci.yml` skipping slow steps |
| `make act-terraform` | Run the `terraform.yml` workflow locally |
| `make act-stress` | Run the `stress.yml` workflow locally |

#### Jenkins (local container)

| Target | What it does |
|--------|-------------|
| `make jenkins-up` | Start local Jenkins LTS container (<http://localhost:8080>) |
| `make jenkins-down` | Stop Jenkins container |
| `make jenkins-clean` | Stop Jenkins and remove its data volume |
| `make jenkins-logs` | Tail Jenkins container logs |

#### LocalStack (fake AWS for Terraform)

| Target | What it does |
|--------|-------------|
| `make localstack-up` | Start LocalStack v3 container |
| `make localstack-down` | Stop LocalStack container |
| `make tf-local-init` | `tflocal init` against LocalStack |
| `make tf-local-plan` | `tflocal plan` against LocalStack |
| `make tf-local-apply` | `tflocal apply` against LocalStack |
| `make tf-local` | Init → plan → apply in one shot |

#### kind (Kubernetes in Docker)

| Target | What it does |
|--------|-------------|
| `make kind-up` | Create a local kind cluster (1 control-plane + 1 worker) |
| `make kind-down` | Delete the kind cluster |
| `make kind-deploy` | `kubectl apply -k k8s/` against the kind cluster |
| `make kind-status` | Show pod status in the kind cluster |

#### Molecule (Ansible role testing)

Runs full Molecule lifecycle (create → converge → verify → destroy) against Ubuntu 22.04 containers.
Requires `pip install molecule molecule-docker` and `ansible-galaxy collection install community.docker community.general`.
See [docs/local-ci.md](docs/local-ci.md#molecule--ansible-role-testing) for the one-time `init` patch and DooD notes.

| Target | What it covers |
|--------|---------------|
| `make molecule-common` | UFW rules, SSH hardening, unattended upgrades, package installs |
| `make molecule-docker` | Docker CE install (GPG key + APT repo), Compose plugin, log rotation config |
| `make molecule-all` | Both roles in sequence |

---

## Development

### Local (no Docker)

```bash
# Next.js only — needs an external Postgres and Redis
bun dev

# Individual microservices
cd services/llm-aggregator  && bun dev   # port 4001
cd services/user-analytics  && bun dev   # port 4002
cd micro-frontends/model-widget && bun dev   # port 5173
```

### Docker Compose (recommended)

```bash
# Start the full dev stack
make dev

# Rebuild a specific service after code changes
docker compose -f docker-compose.dev.yml up --build llm-aggregator

# Tail logs for one service
docker compose -f docker-compose.dev.yml logs -f nextjs-bun-app-dev
```

### Dev Container (VS Code)

Open the repo in VS Code and click **Reopen in Container**. The `.devcontainer/` config installs
Bun, Docker, Prisma CLI, and the PostgreSQL client automatically.

---

## Production (Docker Compose)

```bash
# 1. Create the production env file
cp .env.example .env.production
# Fill in: POSTGRES_USER, POSTGRES_PASSWORD, REDIS_PASSWORD,
#          GRAFANA_ADMIN_PASSWORD, AUTH_SECRET, AUTH_GITHUB_ID/SECRET, etc.

# 2. Start all services (detached)
make prod-up

# Equivalent raw Docker Compose command
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

# 3. Check status
make prod-ps

# 4. Tail logs
make prod-logs
```

| Endpoint | URL | Notes |
|----------|-----|-------|
| App | `http://your-host/` | Through nginx |
| Model Widget | `http://your-host/widget/` | Through nginx |
| Grafana | `http://your-host:3001` | Direct — admin only |
| Prometheus | `http://your-host:9090` | Direct — admin only |
| pgAdmin | `http://your-host:5050` | Direct — admin only |

---

## Kubernetes

### 1. Build and push images

```bash
# Build all four images and push to GHCR
make build-push TAG=sha-$(git rev-parse --short HEAD)

# Or build individually
make build-app build-llm-aggregator build-user-analytics build-model-widget
```

### 2. Deploy

```bash
# Fill in k8s/secrets.yaml — replace every "changeme" with a real value

# Apply the full stack
make k8s-apply

# Wait for rollouts
make k8s-rollout

# Check pods
make k8s-status
```

### Manifest structure

```text
k8s/
├── kustomization.yaml              # Entry point: kubectl apply -k k8s/
├── namespace.yaml
├── secrets.yaml                    # Fill in before applying
├── configmaps/
│   ├── nginx.yaml
│   ├── prometheus.yaml
│   ├── monitoring.yaml             # Tempo + Loki + OTel Collector + postgres-exporter
│   └── grafana-provisioning.yaml   # Datasources + dashboard provider + Promtail
├── postgres.yaml                   # StatefulSet + headless Service + PVC
├── redis.yaml                      # StatefulSet + headless Service + PVC
├── app.yaml                        # nextjs-app Deployment (2 replicas) + Service
├── services.yaml                   # llm-aggregator + user-analytics + model-widget
├── nginx.yaml                      # Deployment + LoadBalancer + internal stub_status
├── pgadmin.yaml                    # Deployment + LoadBalancer (port 5050) + PVC
└── monitoring/
    ├── prometheus.yaml             # Deployment + Service + PVC (30-day retention)
    ├── grafana.yaml                # Deployment + Service + PVC
    ├── otel-collector.yaml         # Deployment + Service (gRPC 4317, HTTP 4318)
    ├── tempo.yaml                  # Deployment + Service + PVC
    ├── loki.yaml                   # Deployment + Service + PVC (7-day retention)
    ├── promtail.yaml               # DaemonSet + ServiceAccount + ClusterRole/Binding
    └── exporters.yaml              # redis-exporter + postgres-exporter + nginx-exporter
```

---

## Infrastructure (Terraform)

Provisions the full AWS stack: VPC, EKS cluster, RDS PostgreSQL, and ElastiCache Redis.

```bash
cd terraform

# 1. Copy and fill in variables
cp terraform.tfvars.example terraform.tfvars

# 2. Initialise providers and modules
make tf-init

# 3. Preview changes
TF_DB_PASSWORD=your-password TF_REDIS_AUTH_TOKEN=your-16-char-token make tf-plan

# 4. Apply
make tf-apply

# 5. Configure kubectl after EKS is up
$(terraform output -raw kubeconfig_command)
```

### Modules

| Module | What it creates |
|--------|----------------|
| `modules/vpc` | VPC (`10.0.0.0/16`), 3 public + 3 private subnets across AZs, NAT gateways, route tables |
| `modules/eks` | EKS cluster (K8s 1.31), managed node group, IAM cluster and node roles, worker security group |
| `modules/rds` | RDS PostgreSQL 16 (`db.t3.micro`), subnet group, SG restricted to EKS nodes, 7-day backups, deletion protection |
| `modules/elasticache` | ElastiCache Redis 7 replication group (2-node, multi-AZ), auth token, TLS, CloudWatch slow-log |

> **Remote state:** Uncomment the `backend "s3"` block in `terraform/main.tf` to store state
> remotely. Create the S3 bucket and DynamoDB lock table first.

---

## Ansible Automation

```bash
cd ansible

# Edit inventory/hosts.yml with your server IPs
# Edit group_vars/all.yml for project-wide settings

# Provision a fresh Ubuntu server (SSH hardening, Docker, UFW)
make ansible-provision

# Deploy the app stack via Docker Compose on remote servers
make ansible-deploy \
  GITHUB_TOKEN=$GITHUB_TOKEN \
  DB_URL="postgresql://..." \
  REDIS_URL="redis://:pass@host:6379" \
  AUTH_SECRET="..." \
  AUTH_GITHUB_ID="..." \
  AUTH_GITHUB_SECRET="..."

# Deploy K8s manifests from a bastion host
make ansible-deploy-k8s \
  AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
```

### Roles

| Role | What it does |
|------|-------------|
| `common` | Updates packages, installs essentials, configures UFW (deny all inbound except SSH), disables root SSH, enables unattended security upgrades |
| `docker` | Installs Docker CE + Compose plugin, configures log rotation (100 MB / 3 files), adds user to `docker` group |
| `app` | Clones repo, templates `.env.production` from Ansible vars, pulls images, deploys with Docker Compose, verifies all health endpoints |
| `kubectl` | Installs kubectl + AWS CLI v2, runs `aws eks update-kubeconfig`, applies `kubectl apply -k k8s/` |

> **Secrets:** Use `ansible-vault encrypt_string` instead of passing secrets as `-e` flags in
> production.

---

## Testing

```bash
# Unit tests — fully mocked, no external dependencies
make test-unit

# Integration tests — start the dev stack first
make dev
make test-integration

# Smoke tests — verify all services respond after a deployment
APP_URL=http://localhost:3000 \
LLM_AGGREGATOR_URL=http://localhost:4001 \
USER_ANALYTICS_URL=http://localhost:4002 \
MODEL_WIDGET_URL=http://localhost:5174 \
make test-smoke

# All suites
make test-all

# k6 stress tests (requires k6 and a running stack)
make stress BASE_URL=http://localhost:3000
```

### Infrastructure tests

```bash
# Validate K8s manifests, Terraform HCL, Ansible playbooks, Jenkinsfile (no live systems)
make test-infra

# Individual suites
make test-infra-k8s
make test-infra-terraform
make test-infra-ansible
make test-infra-jenkins
```

### Test matrix

| Suite | Location | External deps | What is covered |
|-------|----------|--------------|----------------|
| Unit | `tests/unit/` | None (all mocked) | HuggingFace client, Redis cache logic, DB query helper |
| Integration | `tests/integration/` | Postgres, Redis, running services | All API endpoints, validation, error cases |
| Smoke | `tests/smoke/` | All services deployed | Reachability of every service after deploy |
| Stress | `tests/stress/` | k6 + running services | Throughput, p95 latency, error rate under load |
| Infra | `tests/infra/` | None (offline) | K8s manifests, Terraform HCL, Ansible syntax, Jenkinsfile structure |

### k6 thresholds

| Script | Error rate | p95 latency |
|--------|-----------|-------------|
| `k6-app.js` | < 2% | < 2 000 ms |
| `k6-models.js` | < 1% | < 500 ms |

---

## Code Quality

All quality gates run together with `make check` and in CI on every push.

### Linting and formatting

```bash
make lint           # ESLint
make lint-fix       # ESLint with auto-fix
make format         # Prettier (write)
make format-check   # Prettier (check)
make typecheck      # tsc --noEmit
```

### Markdown linting

Rules are defined in [.markdownlint-cli2.yaml](.markdownlint-cli2.yaml). Long lines in tables and
code blocks are allowed (MD013 disabled).

```bash
make lint-docs      # check
```

### Spell checking

Configured in [.codespellrc](.codespellrc). Skips `bun.lock`, `node_modules`, `.next`, generated
files, and paths listed in [.codespellignore](.codespellignore).

```bash
make lint-spell     # check
make spell-fix      # auto-fix in-place
```

### Changelog generation

[cliff.toml](cliff.toml) configures [git-cliff](https://git-cliff.org/) to parse
[conventional commits](https://www.conventionalcommits.org/) into a grouped, linked changelog.

```bash
git tag v1.1.0
make changelog      # overwrites CHANGELOG.md
```

Commit prefixes: `feat`, `fix`, `perf`, `refactor`, `revert`, `docs`, `style`, `test`, `build`,
`ci`. Commits prefixed with `chore` or `wip` are excluded from the changelog.

---

## CI/CD Pipelines

### Local CI (no push required)

| Tool | What you can test locally | Command |
|------|--------------------------|---------|
| `act` | GitHub Actions workflows (`ci.yml`, `terraform.yml`, `stress.yml`) | `make act-ci` |
| Jenkins | Full `Jenkinsfile` pipeline with Replay for fast iteration | `make jenkins-up` |
| LocalStack + `tflocal` | Terraform VPC, RDS, ElastiCache modules against fake AWS | `make tf-local` |
| kind | `kubectl apply -k k8s/` against a real local cluster | `make kind-deploy` |
| Molecule | Ansible `common` and `docker` roles against Ubuntu 22.04 containers | `make molecule-all` |

See [docs/local-ci.md](docs/local-ci.md) for full setup instructions.

### Jenkins (`Jenkinsfile`)

A declarative pipeline at the repo root for self-hosted CI/CD. All stages after Install run in
parallel where possible.

| Stage | Branches | What it does |
|-------|----------|-------------|
| Install | all | `bun install` for root and all services |
| Lint & Type Check | all | ESLint, Prettier, `tsc --noEmit`, markdownlint, codespell — all parallel |
| Unit Tests | all | `bun test:unit` |
| Integration Tests | all | Spins up `postgres:16-alpine` + `redis:8-alpine` via Docker, starts microservices, runs `bun test:integration`, tears down |
| Build Images | `main`, `develop` | Builds all four images in parallel, tagged `sha-<SHA>` and branch name |
| Push Images | `main` only | Logs into GHCR using `ghcr-credentials` and pushes all images |
| Terraform | `main` + PRs | `init` → `fmt -check` → `validate` → `plan` (archives `plan.txt`); `apply` on `main` only |
| Deploy | `main` only | Updates kubeconfig, patches image tags to `sha-<SHA>`, `kubectl apply -k k8s/`, waits for rollouts |
| Smoke Tests | `main` only | `bun test:smoke` against production URLs |

#### Jenkins credentials

Configure under **Manage Jenkins → Credentials**:

| ID | Kind | Used by |
|----|------|---------|
| `ghcr-credentials` | Username/Password | Push Images |
| `aws-access-key-id` | Secret text | Terraform, Deploy |
| `aws-secret-access-key` | Secret text | Terraform, Deploy |
| `aws-region` | Secret text | Terraform, Deploy |
| `tf-db-password` | Secret text | Terraform |
| `tf-redis-auth-token` | Secret text | Terraform |
| `prod-app-url` | Secret text | Smoke Tests |
| `prod-llm-aggregator-url` | Secret text | Smoke Tests |
| `prod-user-analytics-url` | Secret text | Smoke Tests |
| `prod-model-widget-url` | Secret text | Smoke Tests |

#### Required Jenkins plugins

- **Pipeline** (Blue Ocean or classic UI)
- **AnsiColor** — coloured console output
- **Docker Pipeline** — `docker` DSL steps
- **Credentials Binding** — `withCredentials` / `credentials()` helper

### GitHub Actions

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `ci.yml` | Push / PR → `main`, `develop` | lint → docs-lint (markdownlint + codespell) → unit tests → integration tests → build and push all images to GHCR |
| `cd.yml` | CI succeeds on `main` | Patch image tags to `sha-<SHA>` → `kubectl apply -k` → wait for rollouts → smoke tests |
| `terraform.yml` | Push / PR touching `terraform/` | `terraform plan` on PR (posts output as PR comment) → `terraform apply` on merge to `main` |
| `stress.yml` | Nightly 02:00 UTC + manual dispatch | k6 against production; uploads JSON results as 30-day artifacts |

#### Required GitHub Actions secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Used by | Description |
|--------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | cd, terraform, stress | IAM user with EKS + ECR permissions |
| `AWS_SECRET_ACCESS_KEY` | cd, terraform, stress | |
| `AWS_REGION` | cd, terraform | e.g. `us-east-1` |
| `TF_DB_PASSWORD` | terraform | RDS master password |
| `TF_REDIS_AUTH_TOKEN` | terraform | ElastiCache auth token (≥ 16 chars) |
| `PROD_APP_URL` | cd, stress | e.g. `https://your-domain.com` |
| `PROD_LLM_AGGREGATOR_URL` | cd, stress | Internal cluster URL or exposed endpoint |
| `PROD_USER_ANALYTICS_URL` | cd | |
| `PROD_MODEL_WIDGET_URL` | cd | |

---

## Observability

All services are instrumented with OpenTelemetry and push signals to the OTel Collector.

| Signal | Flow |
|--------|------|
| Traces | App / services (`OTEL_EXPORTER_OTLP_ENDPOINT`) → OTel Collector → **Tempo** |
| Metrics | Prometheus scrapes `/metrics` on each service + exporters; OTel Collector also exposes `:8889` |
| Logs | Promtail tails `/var/log/pods/` → **Loki** |

**Grafana** at `:3001` ships with pre-provisioned datasources for Prometheus, Tempo, and Loki:

- Trace-to-logs linking (±1 min span window)
- Trace-to-metrics linking
- Loki → Tempo trace ID extraction

Drop any `.json` dashboard file into `monitoring/grafana/dashboards/` and it is auto-loaded on
Grafana startup.

---

## Services & API Reference

### llm-aggregator (`services/llm-aggregator/`)

Wraps the HuggingFace API with Redis caching (5-minute TTL). All model responses include
`cached: true` and `ttl` fields.

| Endpoint | Params | Description |
|----------|--------|-------------|
| `GET /health` | — | Service health check |
| `GET /metrics` | — | Prometheus metrics |
| `GET /models` | `filter`, `sort`, `limit` (default 500) | Fetch and cache models |
| `GET /models/trending` | — | Top 5 by trending score |
| `DELETE /models/cache` | — | Flush all cached model keys |

### user-analytics (`services/user-analytics/`)

Tracks user events and stores preferences in PostgreSQL. Tables are auto-created on first startup.

| Endpoint | Body / Params | Description |
|----------|--------------|-------------|
| `GET /health` | — | Service health check |
| `GET /metrics` | — | Prometheus metrics |
| `POST /events` | `{ userId, eventType, payload? }` | Track an event |
| `GET /events/:userId` | `?limit` (max 200) | Recent events for a user |
| `GET /preferences/:userId` | — | Get user preferences |
| `PUT /preferences/:userId` | `Record<string, unknown>` | Upsert preferences |

### model-widget (`micro-frontends/model-widget/`)

Standalone Vite + React SPA served at `/widget/`. Fetches from llm-aggregator via the nginx proxy
at `/api/models`. Supports filtering by task type and sorting by downloads, likes, or trending
score.

---

## Environment Variables

Copy `.env.example` to `.env.local` (dev) or `.env.production` (prod) and fill in the values.

| Variable | Env | Required | Description |
|----------|-----|----------|-------------|
| `DATABASE_URL` | all | Yes | `postgresql://user:pass@host:5432/db?schema=public` |
| `REDIS_URL` | all | Yes | `redis://localhost:6379` (dev) / `redis://:pass@host:6379` (prod) |
| `NEXTAUTH_URL` | all | Yes | Full base URL, e.g. `https://your-domain.com` |
| `AUTH_SECRET` | all | Yes | Random 32-byte base64 string — see [Auth Setup](#auth-setup) |
| `AUTH_GITHUB_ID` | all | Yes | GitHub OAuth app client ID |
| `AUTH_GITHUB_SECRET` | all | Yes | GitHub OAuth app client secret |
| `NEXT_PUBLIC_SENTRY_DSN` | all | No | Sentry DSN (exposed to browser) |
| `SENTRY_DSN` | all | No | Sentry DSN (server-side, same value) |
| `SENTRY_AUTH_TOKEN` | build | No | Source map upload token — needed for readable stack traces |
| `POSTGRES_USER` | prod | Yes | PostgreSQL username (Docker Compose) |
| `POSTGRES_PASSWORD` | prod | Yes | PostgreSQL password |
| `REDIS_PASSWORD` | prod | Yes | Redis auth token |
| `PGADMIN_DEFAULT_PASSWORD` | prod | Yes | pgAdmin UI password |
| `GRAFANA_ADMIN_PASSWORD` | prod | Yes | Grafana admin password |

---

## Auth Setup

### 1. Generate `AUTH_SECRET`

```bash
openssl rand -base64 32
```

Paste the output into `AUTH_SECRET` in `.env.local`.

### 2. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Fill in:
   - **Application name:** `DevOps Pipeline (dev)`
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
3. Copy **Client ID** → `AUTH_GITHUB_ID`
4. Generate a **Client Secret** → `AUTH_GITHUB_SECRET`

For production, create a separate OAuth app with your real domain as the callback URL.

> **Note:** The GitHub provider is configured with `checks: ["none"]` in
> `src/lib/auth.config.ts` to suppress a known Auth.js v5 issuer-validation error with GitHub's
> OAuth implementation.

---

## Sentry Setup

1. Create a project at [sentry.io](https://sentry.io) (platform: **Next.js**)
2. Copy the **DSN** from **Project Settings → Client Keys**
3. Set both `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` to the same DSN value
4. For readable stack traces in production:
   - Go to **sentry.io/settings/auth-tokens** → create a token with `project:releases` and
     `org:read` scopes
   - Set `SENTRY_AUTH_TOKEN` in `.env.local` and as a GitHub Actions secret

---

## Port Reference

| Service | Dev port | Notes |
|---------|----------|-------|
| nginx | 80 | Main reverse proxy entry point |
| nextjs-app | 3000 | Direct in dev; internal only in prod |
| llm-aggregator | 4001 | HuggingFace proxy with Redis cache |
| user-analytics | 4002 | Event tracking and user preferences |
| model-widget | 5174 | Vite dev server; nginx serves `/widget/` in prod |
| PostgreSQL | 5433 | Host-mapped (container runs on 5432) |
| Redis | 6379 | Dev only; password-protected and internal in prod |
| pgAdmin | 5050 | Database management UI |
| Prisma Studio | 5555 | ORM UI — dev only |
| Redis Commander | 8082 | Redis UI — dev only |
| Grafana | 3001 | Direct port — admin/observability UI |
| Prometheus | 9090 | Direct port — admin/observability UI |
| Loki | 3100 (internal) | Not exposed externally |
| Tempo | 3200 (internal) | Not exposed externally |
| OTel Collector | 4317 / 4318 | gRPC / HTTP OTLP receivers — internal only |

---

## Security

See [SECURITY.md](SECURITY.md) for the full vulnerability reporting policy and the security
measures in place.

To report a vulnerability privately, use
[GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
feature (**Security → Report a vulnerability**).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

To regenerate after tagging a new release:

```bash
git tag v1.x.0
make changelog
```
