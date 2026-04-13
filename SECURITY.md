# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` (latest) | Yes |
| Older branches | No — please update to `main` |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report security issues by emailing the maintainer directly or by using
[GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
feature on this repository (**Security → Report a vulnerability**).

Include as much of the following as possible:

- Type of vulnerability (e.g. SQL injection, XSS, authentication bypass)
- File paths and line numbers of the affected code
- Steps to reproduce (PoC script or request/response logs)
- Potential impact and severity assessment

You should receive an acknowledgement within **48 hours** and a resolution
plan within **7 days**.

## Scope

In scope:

- The Next.js application (`src/`)
- Microservices (`services/`)
- Infrastructure configuration (`k8s/`, `terraform/`, `ansible/`)
- Docker images and Compose files
- Authentication flows (NextAuth.js / GitHub OAuth)

Out of scope:

- Third-party services (GitHub, HuggingFace, Sentry, AWS managed services)
- Denial-of-service attacks against public endpoints
- Issues that require physical access to infrastructure

## Security Measures in Place

- GitHub OAuth with `AUTH_SECRET` (random 32-byte base64)
- All secrets passed via environment variables, never hardcoded
- Kubernetes secrets (`k8s/secrets.yaml`) must be filled before deployment
- Ansible secrets managed with `ansible-vault`
- Redis and PostgreSQL are not exposed externally in production
- Container images run as non-root where possible
- UFW firewall configured by Ansible (deny all inbound except SSH)
- Sentry for runtime error tracking
- Dependabot (see `.github/dependabot.yml` if configured) for dependency updates
