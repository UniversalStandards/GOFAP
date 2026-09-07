<div align="center">

# GOFAP / GOFAPS

### Government Operations, Financial, Accounting & Personnel System

[![Deploy](https://img.shields.io/badge/Deploy-Selected%20Platform-2ea44f?style=for-the-badge&logo=githubactions&logoColor=white)](/actions/workflows/deploy-selected-platform.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

[Overview](#overview) · [Readiness](#current-production-readiness) · [Architecture](#architecture) · [Quickstart](#quickstart) · [Testing](#testing) · [CI/CD](#cicd) · [Deployment](#deployment) · [Operations](#operations) · [Repo layout](#repo-layout)

</div>

## Overview

GOFAPS is a configurable government operations platform spanning financial management, personnel, procurement, payments, reporting, and citizen services. The application is a TypeScript monorepo with a React client, Express API, and PostgreSQL persistence.

This README is the shortest path from checkout to a running, testable deployment. For the product narrative, module inventory, integrations, and intended audience, see [Platform overview](docs/platform-overview.md). For contribution rules, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Current production readiness

**Status: stabilization in progress.** Deployment automation and core application flows exist, but the repository should not be interpreted as fully certified or complete for every advertised government workload.

Known gaps for the current `v0.1.x` stabilization milestone include:

- raising automated test coverage to at least 90%;
- replacing remaining static UI data with API-backed flows;
- gating incomplete routes with feature flags;
- completing the WCAG 2.1 AA audit;
- establishing repeatable performance baselines; and
- completing notification, session-cleanup, and observability work.

Use [PRODUCTION_STATUS.md](PRODUCTION_STATUS.md) for the detailed readiness assessment and [ROADMAP.md](ROADMAP.md#-currently-active--v01x-stabilization) for owners, acceptance criteria, and later milestones. Compliance and production claims require independent review for the target agency and environment.

## Architecture

```text
Browser
  └─ React 18 + Vite + TanStack Query
       └─ Express API (Node.js + TypeScript)
            ├─ authentication, validation, rate limiting, audit services
            ├─ Drizzle ORM ── PostgreSQL / Neon
            └─ optional payment, banking, and notification providers
```

Shared Zod schemas in `shared/` define contracts used by the client and server. Production packaging builds static client assets and a bundled Node.js server. See [Architecture](docs/architecture.md) for component boundaries, request flow, data model, security controls, and architectural trade-offs.

## Quickstart

### Prerequisites

- Node.js 20 or later and npm
- PostgreSQL, or a compatible hosted PostgreSQL database

```bash
git clone https://github.com/UniversalStandards/GOFAP.git
cd GOFAP
npm ci
cp .env.example .env
```

Set `DATABASE_URL` and replace the example `SESSION_SECRET` with a value of at least 32 characters. The remaining settings and optional provider keys are documented inline in `.env.example`.

```bash
npm run db:push
npm run dev
```

The combined development server listens on `http://localhost:5000` by default. See [DEVELOPMENT.md](DEVELOPMENT.md) for authentication setup, database options, and troubleshooting. Alternatively, start the containerized application and database with `docker compose up --build`.

## Testing

Run the same primary checks used for pull requests:

```bash
npm run check
npm run lint
npm test
npm run build
```

Vitest covers server, client, and integration behavior. Add regression tests alongside changed code; the current coverage gap is tracked in the [stabilization roadmap](ROADMAP.md#-currently-active--v01x-stabilization).

## CI/CD

GitHub Actions separates validation, image creation, promotion, and host deployment:

| Workflow | Purpose |
|---|---|
| [`pr-checks.yml`](.github/workflows/pr-checks.yml) | Typecheck, lint, test, build, and retain build artifacts for pull requests |
| [`ci.yml`](.github/workflows/ci.yml) | Typecheck pushes to `main` and `release/**` |
| [`container-image.yml`](.github/workflows/container-image.yml) | Build, publish, and scan the container image |
| [`promote-image.yml`](.github/workflows/promote-image.yml) | Promote an existing image between environments |
| [`deploy-selected-platform.yml`](.github/workflows/deploy-selected-platform.yml) | Manually deploy a Git ref to UpCloud, AWS EC2, or Azure VM |

Environment protection rules and required reviewers should be configured in GitHub before production use. See [DEPLOYMENT_WORKFLOW.md](DEPLOYMENT_WORKFLOW.md) for secrets, host preparation, safety controls, and troubleshooting.

## Deployment

The deploy button at the top opens the manual **Deploy (Selected Platform)** workflow. Configure the target's GitHub environment, deployment secrets, SSH key, and verified host fingerprint before proceeding.

### Run workflow

1. Open the repository's **Actions** tab (or click the **Deploy** button above).
2. Select **Deploy (Selected Platform)**.
3. Select **Run workflow** and choose the branch containing the workflow.
4. Choose `upcloud`, `aws-ec2`, or `azure-vm` as the **Target platform**.
5. Choose `dev`, `staging`, or `production` as the **Deployment environment**.
6. Enter the branch, tag, or commit to deploy in **Git ref**.
7. Leave **Dry run** enabled for the first run, then review the validation logs.
8. Run the workflow again with **Dry run** disabled. Approve any configured environment gate and verify the post-deployment health check.

Production changes require human approval. Complete the [deployment checklist](DEPLOYMENT_CHECKLIST.md) and use the platform guide: [AWS EC2](EC2_DEPLOYMENT_GUIDE.md), [Azure VM and Cloudflare](AZURE_CLOUDFLARE_DEPLOYMENT.md), or [UpCloud](DEPLOYMENT_UPCLOUD.md).

## Operations

- **Liveness:** `GET /health` and `GET /health/live`
- **Readiness:** `GET /health/ready`
- **Detailed diagnostics:** `GET /health/detailed`
- **Process management:** [PM2 configuration](ecosystem.config.js) or [systemd unit](gofaps.service)
- **Reverse proxy:** [NGINX configuration](nginx.conf)
- **Security reporting and controls:** [SECURITY.md](SECURITY.md)
- **Go-live and rollback checks:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

Treat readiness failures as a failed deployment. Monitor structured application logs and database health after release, and use the workflow's recorded previous commit for rollback. The [operations guide](docs/operations.md) describes health interpretation, deployment verification, rollback, logging, and escalation.

## Repo layout

```text
client/             React application, pages, hooks, and UI components
server/             Express API, middleware, services, storage, and server tests
shared/             Shared Drizzle models and Zod schemas
tests/integration/  Cross-layer integration tests
scripts/            Development and maintenance scripts
.github/workflows/  Validation, image, promotion, and deployment automation
docs/               Long-form product, architecture, and operations guides
```

Deployment manifests and platform guides live at the repository root so operators can find them without navigating application internals.
