.DEFAULT_GOAL := help
SHELL         := /bin/bash

REGISTRY      ?= ghcr.io
IMAGE_PREFIX  ?= ghcr.io/vijaychandar186
TAG           ?= latest
NAMESPACE     ?= devops-pipeline
AWS_REGION    ?= us-east-1
CLUSTER_NAME  ?= devops-pipeline-production

# ── Colours ──────────────────────────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
GREEN := \033[32m
CYAN  := \033[36m

.PHONY: help
help: ## Show this help message
	@printf '$(BOLD)Usage:$(RESET)\n'
	@printf '  make $(CYAN)<target>$(RESET)\n\n'
	@printf '$(BOLD)Targets:$(RESET)\n'
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_\/-]+:.*?##/ \
	  { printf "  $(CYAN)%-30s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ── Setup ─────────────────────────────────────────────────────────────────────
.PHONY: install
install: ## Install all root + service dependencies
	bun install --frozen-lockfile
	bun install --frozen-lockfile --cwd services/llm-aggregator
	bun install --frozen-lockfile --cwd services/user-analytics
	bun install --frozen-lockfile --cwd micro-frontends/model-widget

.PHONY: env
env: ## Copy .env.example → .env.local (skip if already exists)
	@test -f .env.local && echo '.env.local already exists — skipping' || \
	  (cp .env.example .env.local && echo 'Created .env.local — fill in the values')

# ── Lint & format ─────────────────────────────────────────────────────────────
.PHONY: lint
lint: ## Run ESLint
	bun lint

.PHONY: lint-fix
lint-fix: ## Run ESLint with auto-fix
	bun lint:fix

.PHONY: format
format: ## Format all files with Prettier
	bun format

.PHONY: format-check
format-check: ## Check formatting without writing
	bun format:check

.PHONY: typecheck
typecheck: ## Run TypeScript type-checker (no emit)
	bunx tsc --noEmit

.PHONY: lint-docs
lint-docs: ## Lint Markdown files with markdownlint-cli2
	bunx markdownlint-cli2 "**/*.md" "!node_modules" "!CHANGELOG.md"

.PHONY: lint-spell
lint-spell: ## Spell-check source and docs with codespell
	codespell

.PHONY: spell-fix
spell-fix: ## Auto-fix codespell findings in-place
	codespell --write-changes

.PHONY: changelog
changelog: ## Regenerate CHANGELOG.md with git-cliff (requires git-cliff in PATH)
	git-cliff -o CHANGELOG.md

.PHONY: check
check: lint format-check typecheck lint-docs lint-spell ## lint + format-check + typecheck + markdown + spell

# ── Testing ───────────────────────────────────────────────────────────────────
.PHONY: test
test: test-unit ## Alias for test-unit

.PHONY: test-unit
test-unit: ## Run unit tests (no external deps)
	bun test:unit

.PHONY: test-integration
test-integration: ## Run integration tests (needs Postgres + Redis + services)
	bun test:integration

.PHONY: test-smoke
test-smoke: ## Run smoke tests against a running stack
	APP_URL=$${APP_URL:-http://localhost:3000} \
	LLM_AGGREGATOR_URL=$${LLM_AGGREGATOR_URL:-http://localhost:4001} \
	USER_ANALYTICS_URL=$${USER_ANALYTICS_URL:-http://localhost:4002} \
	MODEL_WIDGET_URL=$${MODEL_WIDGET_URL:-http://localhost:5174} \
	bun test:smoke

.PHONY: test-all
test-all: ## Run all test suites
	bun test:all

.PHONY: test-dev-stack
test-dev-stack: ## Test every service in the dev stack (requires: make dev)
	NEXTJS_URL=$${NEXTJS_URL:-http://localhost:3000} \
	NGINX_URL=$${NGINX_URL:-http://localhost:80} \
	LLM_AGGREGATOR_URL=$${LLM_AGGREGATOR_URL:-http://localhost:4001} \
	USER_ANALYTICS_URL=$${USER_ANALYTICS_URL:-http://localhost:4002} \
	MODEL_WIDGET_URL=$${MODEL_WIDGET_URL:-http://localhost:5174} \
	REDIS_COMMANDER_URL=$${REDIS_COMMANDER_URL:-http://localhost:8082} \
	PGADMIN_URL=$${PGADMIN_URL:-http://localhost:5050} \
	PRISMA_STUDIO_URL=$${PRISMA_STUDIO_URL:-http://localhost:5555} \
	POSTGRES_HOST=$${POSTGRES_HOST:-localhost} \
	POSTGRES_PORT=$${POSTGRES_PORT:-5433} \
	POSTGRES_USER=$${POSTGRES_USER:-admin} \
	POSTGRES_PASSWORD=$${POSTGRES_PASSWORD:-mysecretpassword} \
	POSTGRES_DB=$${POSTGRES_DB:-mydatabase} \
	REDIS_HOST=$${REDIS_HOST:-localhost} \
	REDIS_PORT=$${REDIS_PORT:-6379} \
	bun test:dev-stack

.PHONY: test-monitoring
test-monitoring: ## Test every monitoring service in the prod stack (requires: make prod-up)
	PROMETHEUS_URL=$${PROMETHEUS_URL:-http://localhost:9090} \
	GRAFANA_URL=$${GRAFANA_URL:-http://localhost:3001} \
	TEMPO_URL=$${TEMPO_URL:-http://localhost:3200} \
	LOKI_URL=$${LOKI_URL:-http://localhost:3100} \
	OTEL_COLLECTOR_METRICS_URL=$${OTEL_COLLECTOR_METRICS_URL:-http://localhost:8888} \
	REDIS_EXPORTER_URL=$${REDIS_EXPORTER_URL:-http://localhost:9121} \
	POSTGRES_EXPORTER_URL=$${POSTGRES_EXPORTER_URL:-http://localhost:9187} \
	NGINX_EXPORTER_URL=$${NGINX_EXPORTER_URL:-http://localhost:9113} \
	bun test:monitoring

.PHONY: test-infra
test-infra: ## Validate Ansible, K8s, Terraform, and Jenkinsfile (no live systems needed)
	bun test:infra

.PHONY: test-infra-ansible
test-infra-ansible: ## Validate Ansible playbooks (syntax-check + optional lint)
	bun test:infra:ansible

.PHONY: test-infra-k8s
test-infra-k8s: ## Validate K8s manifests via kustomize build + dry-run
	bun test:infra:k8s

.PHONY: test-infra-terraform
test-infra-terraform: ## Validate Terraform HCL (fmt check + validate)
	bun test:infra:terraform

.PHONY: test-infra-jenkins
test-infra-jenkins: ## Validate Jenkinsfile pipeline structure and stages
	bun test:infra:jenkins

.PHONY: stress
stress: ## Run k6 stress tests (requires k6 and running services)
	mkdir -p results
	k6 run tests/stress/k6-app.js    -e BASE_URL=$${BASE_URL:-http://localhost:3000}    --out json=results/k6-app.json
	k6 run tests/stress/k6-models.js -e BASE_URL=$${BASE_URL:-http://localhost:4001} --out json=results/k6-models.json

# ── Development ───────────────────────────────────────────────────────────────
.PHONY: dev
dev: ## Start the full dev stack via Docker Compose
	docker compose -f docker-compose.dev.yml up

.PHONY: dev-build
dev-build: ## Rebuild and start the dev stack
	BUILDX_NO_DEFAULT_ATTESTATIONS=1 docker compose -f docker-compose.dev.yml up --build

.PHONY: dev-build-nocache
dev-build-nocache: ## Rebuild all dev images from scratch (no cache) and start
	BUILDX_NO_DEFAULT_ATTESTATIONS=1 docker compose -f docker-compose.dev.yml build --no-cache && \
	docker compose -f docker-compose.dev.yml up

.PHONY: dev-down
dev-down: ## Stop the dev stack
	docker compose -f docker-compose.dev.yml down

.PHONY: dev-reset
dev-reset: ## Stop stack, wipe node_modules volume, and rebuild from scratch (fixes stale deps)
	docker compose -f docker-compose.dev.yml down
	docker volume rm devops-pipeline_nextjs-node-modules-dev || true
	docker compose -f docker-compose.dev.yml build --no-cache
	docker compose -f docker-compose.dev.yml up

.PHONY: dev-logs
dev-logs: ## Tail dev stack logs
	docker compose -f docker-compose.dev.yml logs -f

.PHONY: prisma-studio
prisma-studio: ## Open Prisma Studio (port 5555)
	bunx prisma studio

.PHONY: prisma-migrate
prisma-migrate: ## Run Prisma migrations (dev)
	bunx prisma migrate dev

.PHONY: prisma-generate
prisma-generate: ## Regenerate Prisma client
	bunx prisma generate

# ── Production Docker Compose ─────────────────────────────────────────────────
.PHONY: prod-up
prod-up: ## Start the production stack (detached)
	docker compose --env-file .env.production -f docker-compose.prod.yml up -d

.PHONY: prod-up-build
prod-up-build: ## Rebuild images and start the production stack (detached)
	BUILDX_NO_DEFAULT_ATTESTATIONS=1 docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

.PHONY: prod-down
prod-down: ## Stop the production stack
	docker compose --env-file .env.production -f docker-compose.prod.yml down

.PHONY: prod-logs
prod-logs: ## Tail production stack logs
	docker compose --env-file .env.production -f docker-compose.prod.yml logs -f

.PHONY: prod-ps
prod-ps: ## Show production stack container status
	docker compose --env-file .env.production -f docker-compose.prod.yml ps

# ── Docker images ─────────────────────────────────────────────────────────────
.PHONY: build
build: build-app build-llm-aggregator build-user-analytics build-model-widget ## Build all Docker images

.PHONY: build-app
build-app: ## Build the Next.js app image
	docker build -f Dockerfile.prod \
	  -t $(IMAGE_PREFIX)/devops-pipeline:$(TAG) .

.PHONY: build-llm-aggregator
build-llm-aggregator: ## Build the llm-aggregator image
	docker build -f services/llm-aggregator/Dockerfile \
	  -t $(IMAGE_PREFIX)/devops-pipeline-llm-aggregator:$(TAG) \
	  services/llm-aggregator/

.PHONY: build-user-analytics
build-user-analytics: ## Build the user-analytics image
	docker build -f services/user-analytics/Dockerfile \
	  -t $(IMAGE_PREFIX)/devops-pipeline-user-analytics:$(TAG) \
	  services/user-analytics/

.PHONY: build-model-widget
build-model-widget: ## Build the model-widget image
	docker build -f micro-frontends/model-widget/Dockerfile \
	  -t $(IMAGE_PREFIX)/devops-pipeline-model-widget:$(TAG) \
	  micro-frontends/model-widget/

.PHONY: push
push: ## Push all images to the registry (login first)
	docker push $(IMAGE_PREFIX)/devops-pipeline:$(TAG)
	docker push $(IMAGE_PREFIX)/devops-pipeline-llm-aggregator:$(TAG)
	docker push $(IMAGE_PREFIX)/devops-pipeline-user-analytics:$(TAG)
	docker push $(IMAGE_PREFIX)/devops-pipeline-model-widget:$(TAG)

.PHONY: build-push
build-push: build push ## Build and push all images

# ── Kubernetes ────────────────────────────────────────────────────────────────
.PHONY: k8s-apply
k8s-apply: ## Apply all Kubernetes manifests
	kubectl apply -k k8s/

.PHONY: k8s-status
k8s-status: ## Show pod status in the devops-pipeline namespace
	kubectl get pods -n $(NAMESPACE)

.PHONY: k8s-rollout
k8s-rollout: ## Wait for all deployments to roll out
	kubectl rollout status deployment/nextjs-app      -n $(NAMESPACE) --timeout=300s
	kubectl rollout status deployment/llm-aggregator  -n $(NAMESPACE) --timeout=300s
	kubectl rollout status deployment/user-analytics  -n $(NAMESPACE) --timeout=300s
	kubectl rollout status deployment/model-widget    -n $(NAMESPACE) --timeout=300s

.PHONY: k8s-restart
k8s-restart: ## Rollout-restart all deployments (pick up new secrets/configmaps)
	kubectl rollout restart deployment -n $(NAMESPACE)

.PHONY: k8s-logs
k8s-logs: ## Tail logs for the nextjs-app pods
	kubectl logs -n $(NAMESPACE) -l app=nextjs-app -f

.PHONY: kubeconfig
kubeconfig: ## Update local kubeconfig for the EKS cluster
	aws eks update-kubeconfig --region $(AWS_REGION) --name $(CLUSTER_NAME)

# ── Terraform ─────────────────────────────────────────────────────────────────
.PHONY: tf-init
tf-init: ## terraform init
	cd terraform && terraform init

.PHONY: tf-fmt
tf-fmt: ## terraform fmt (in-place)
	cd terraform && terraform fmt -recursive

.PHONY: tf-validate
tf-validate: ## terraform validate
	cd terraform && terraform validate

.PHONY: tf-plan
tf-plan: ## terraform plan (set TF_DB_PASSWORD and TF_REDIS_AUTH_TOKEN env vars)
	cd terraform && terraform plan \
	  -var="db_password=$(TF_DB_PASSWORD)" \
	  -var="redis_auth_token=$(TF_REDIS_AUTH_TOKEN)" \
	  -out=tfplan

.PHONY: tf-apply
tf-apply: ## terraform apply the saved plan
	cd terraform && terraform apply tfplan

.PHONY: tf-destroy
tf-destroy: ## terraform destroy (prompts for confirmation)
	cd terraform && terraform destroy \
	  -var="db_password=$(TF_DB_PASSWORD)" \
	  -var="redis_auth_token=$(TF_REDIS_AUTH_TOKEN)"

.PHONY: tf-output
tf-output: ## Show terraform outputs
	cd terraform && terraform output

# ── Ansible ───────────────────────────────────────────────────────────────────
.PHONY: ansible-provision
ansible-provision: ## Provision a fresh Ubuntu server (SSH hardening + Docker + UFW)
	cd ansible && ansible-playbook playbooks/provision.yml

.PHONY: ansible-deploy
ansible-deploy: ## Deploy the app stack via Docker Compose on remote servers
	cd ansible && ansible-playbook playbooks/deploy.yml \
	  -e registry_username=vijaychandar186 \
	  -e registry_token=$(GITHUB_TOKEN) \
	  -e db_url="$(DB_URL)" \
	  -e redis_url="$(REDIS_URL)" \
	  -e auth_secret="$(AUTH_SECRET)" \
	  -e auth_github_id="$(AUTH_GITHUB_ID)" \
	  -e auth_github_secret="$(AUTH_GITHUB_SECRET)"

.PHONY: ansible-deploy-k8s
ansible-deploy-k8s: ## Deploy K8s manifests from a bastion host via Ansible
	cd ansible && ansible-playbook playbooks/deploy-k8s.yml \
	  -e aws_access_key_id=$(AWS_ACCESS_KEY_ID) \
	  -e aws_secret_access_key=$(AWS_SECRET_ACCESS_KEY)

.PHONY: ansible-ping
ansible-ping: ## Ping all inventory hosts
	cd ansible && ansible all -m ping

# ── Observability ─────────────────────────────────────────────────────────────
.PHONY: grafana-open
grafana-open: ## Open Grafana in the default browser (dev stack)
	@which xdg-open >/dev/null 2>&1 && xdg-open http://localhost:3001 || \
	  open http://localhost:3001 2>/dev/null || \
	  echo 'Open http://localhost:3001 in your browser'

.PHONY: prom-open
prom-open: ## Open Prometheus UI (dev stack)
	@which xdg-open >/dev/null 2>&1 && xdg-open http://localhost:9090 || \
	  open http://localhost:9090 2>/dev/null || \
	  echo 'Open http://localhost:9090 in your browser'

# ── CI simulation ─────────────────────────────────────────────────────────────
.PHONY: ci
ci: check test-unit test-integration test-infra ## Run the full CI pipeline locally (no Docker build)

# ── act — GitHub Actions locally ─────────────────────────────────────────────
# Install: curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
# First run: cp .act.secrets.example .act.secrets  &&  cp .act.env.example .act.env
# Note: cd.yml uses workflow_run trigger — run with: act workflow_run -e .github/act-events/cd.json

.PHONY: act-ci
act-ci: ## Run ci.yml (lint + unit tests + integration tests + build) locally via act
	act -W .github/workflows/ci.yml

.PHONY: act-ci-fast
act-ci-fast: ## Run only the lint and unit-tests jobs from ci.yml (skip Docker build)
	act -W .github/workflows/ci.yml -j lint -j unit-tests

.PHONY: act-terraform
act-terraform: ## Run terraform.yml locally via act (uses fake AWS creds by default)
	act -W .github/workflows/terraform.yml

.PHONY: act-stress
act-stress: ## Run stress.yml locally via act (workflow_dispatch)
	act workflow_dispatch -W .github/workflows/stress.yml \
	  -e '{"inputs":{"target_url":"http://localhost:3000"}}'

.PHONY: act-list
act-list: ## List all jobs act would run from ci.yml
	act -W .github/workflows/ci.yml --list

# ── Jenkins — run Jenkinsfile locally ────────────────────────────────────────
# First run: make jenkins-up  (builds image + downloads plugins, takes ~3 min)
# Access: http://localhost:8080  login: admin / admin
# Iterate: open a build → Replay → edit Jenkinsfile inline → Run

.PHONY: jenkins-up
jenkins-up: ## Build image and start Jenkins (first run ~3 min)
	docker compose -f docker-compose.jenkins.yml up -d --build

.PHONY: jenkins-down
jenkins-down: ## Stop Jenkins (state is preserved in the jenkins-home volume)
	docker compose -f docker-compose.jenkins.yml down

.PHONY: jenkins-clean
jenkins-clean: ## Stop Jenkins and wipe all data (fresh start)
	docker compose -f docker-compose.jenkins.yml down -v

.PHONY: jenkins-logs
jenkins-logs: ## Tail Jenkins startup logs
	docker compose -f docker-compose.jenkins.yml logs -f

# ── LocalStack — AWS emulator for Terraform testing ──────────────────────────
# Emulates: VPC, EC2, RDS, ElastiCache, IAM, STS
# Does NOT emulate: EKS (use kind-up for Kubernetes testing)

.PHONY: localstack-up
localstack-up: ## Start LocalStack (waits for healthy)
	docker compose -f docker-compose.localstack.yml up -d
	@echo "Waiting for LocalStack to be ready..."
	@docker compose -f docker-compose.localstack.yml wait localstack 2>/dev/null || \
	  until curl -sf http://localhost:4566/_localstack/health | grep -q '"ec2"'; do sleep 2; done
	@echo "LocalStack is ready → http://localhost:4566"

.PHONY: localstack-down
localstack-down: ## Stop LocalStack and wipe state
	docker compose -f docker-compose.localstack.yml down -v

.PHONY: tf-local-init
tf-local-init: ## terraform init in localstack/ (via tflocal — install: pip install terraform-local)
	cd terraform/localstack && tflocal init

.PHONY: tf-local-plan
tf-local-plan: ## Plan VPC + RDS + ElastiCache against LocalStack
	cd terraform/localstack && tflocal plan

.PHONY: tf-local-apply
tf-local-apply: ## Apply VPC + RDS + ElastiCache to LocalStack
	cd terraform/localstack && tflocal apply -auto-approve

.PHONY: tf-local-destroy
tf-local-destroy: ## Destroy LocalStack resources
	cd terraform/localstack && tflocal destroy -auto-approve

.PHONY: tf-local
tf-local: localstack-up tf-local-init tf-local-apply ## Start LocalStack + init + apply (full workflow)

# ── kind — Kubernetes in Docker ───────────────────────────────────────────────
# Install kind: go install sigs.k8s.io/kind@latest   or brew install kind

.PHONY: kind-up
kind-up: ## Create a local kind cluster (devops-pipeline)
	kind create cluster --config kind-config.yaml
	kubectl cluster-info --context kind-devops-pipeline

.PHONY: kind-down
kind-down: ## Delete the local kind cluster
	kind delete cluster --name devops-pipeline

.PHONY: kind-deploy
kind-deploy: ## Apply all k8s manifests to the local kind cluster
	kubectl config use-context kind-devops-pipeline
	kubectl apply -k k8s/
	kubectl rollout status deployment/nextjs-app     -n $(NAMESPACE) --timeout=300s
	kubectl rollout status deployment/llm-aggregator -n $(NAMESPACE) --timeout=300s

.PHONY: kind-status
kind-status: ## Show pod status in the local kind cluster
	kubectl config use-context kind-devops-pipeline
	kubectl get all -n $(NAMESPACE)

.PHONY: kind-reset
kind-reset: kind-down kind-up ## Tear down and recreate the kind cluster

# ── Molecule — Ansible role testing ──────────────────────────────────────────
# Install: pip install molecule molecule-docker
# Runs roles against a Docker container (Ubuntu 22.04 with systemd)

.PHONY: molecule-common
molecule-common: ## Test the common role with Molecule
	cd ansible/roles/common && molecule test

.PHONY: molecule-docker
molecule-docker: ## Test the docker role with Molecule
	cd ansible/roles/docker && molecule test

.PHONY: molecule-all
molecule-all: molecule-common molecule-docker ## Test all roles with Molecule
