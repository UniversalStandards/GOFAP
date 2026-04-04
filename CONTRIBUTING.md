# Contributing to GOFAPS

> **Government Operations, Financial, Accounting & Personnel System**  
> Managed by the Office of Finance, Accounting & Personnel Services (OFAPS)  
> US Department of Special Projects and Unified Response Services

Thank you for your interest in contributing to GOFAPS. This document outlines the standards, workflows, and expectations for all contributors — human and AI alike.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Environment](#development-environment)
4. [Branching & Commit Standards](#branching--commit-standards)
5. [Pull Request Process](#pull-request-process)
6. [Code Standards](#code-standards)
7. [Testing Requirements](#testing-requirements)
8. [Security Requirements](#security-requirements)
9. [AI Developer Guidelines](#ai-developer-guidelines)
10. [Issue Labels](#issue-labels)
11. [Contact](#contact)

---

## Code of Conduct

All contributors are expected to maintain professional, respectful conduct consistent with federal workplace standards. Harassment, discrimination, or bad-faith contributions will result in immediate removal of access.

---

## Getting Started

1. **Fork** the repository to your GitHub account.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/GOFAP.git
   cd GOFAP
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Configure** your environment:
   ```bash
   cp .env.example .env
   # Fill in required values — see README.md for variable reference
   ```
5. **Run** the dev server:
   ```bash
   npm run dev
   ```
6. **Verify** all checks pass on your baseline:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

---

## Development Environment

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 15+ (or Neon serverless) |
| Docker *(optional)* | 24+ |
| TypeScript | 5.x (installed via devDeps) |

See [`DEVELOPMENT.md`](DEVELOPMENT.md) for full local setup instructions, Docker Compose usage, and environment variable reference.

---

## Branching & Commit Standards

### Branch Naming

```
feat/issue-{number}-short-description        # New features
fix/issue-{number}-short-description         # Bug fixes
docs/short-description                       # Documentation only
chore/short-description                      # Tooling, deps, config
refactor/short-description                   # Code restructuring without behavior change
test/short-description                       # Test additions/fixes only
security/short-description                   # Security patches
```

**Examples:**
```
feat/issue-42-vendor-self-service-portal
fix/issue-87-payroll-tax-rounding
docs/update-deployment-guide
security/cve-2025-12345-helmet-upgrade
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: Closes #issue]
```

**Types:** `feat` | `fix` | `docs` | `chore` | `refactor` | `test` | `perf` | `security` | `ci`

**Scopes:** `financial` | `hr` | `procurement` | `fleet` | `constituent` | `analytics` | `auth` | `api` | `db` | `ui` | `infra` | `ai`

**Examples:**
```
feat(financial): add inter-fund transfer automation with GL posting
fix(hr): correct FMLA leave balance accrual calculation
security(auth): upgrade openid-client to resolve token validation bypass
test(financial): add Vitest coverage for AP 3-way matching logic
```

---

## Pull Request Process

### Before Opening a PR

- [ ] Branch is up to date with `main`
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run test` passes; coverage does not regress below current baseline
- [ ] No new secrets, credentials, or sensitive data are present in any committed file
- [ ] Feature flags applied to any UI routes or API endpoints not yet fully implemented
- [ ] PRODUCTION paths return real data — no mock returns, no placeholder stubs
- [ ] All new API endpoints: validate input (Zod), require authentication, write to audit log

### PR Description Template

When opening a PR, include:

```markdown
## Summary
Brief description of what this PR does and why.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Refactor
- [ ] Security patch
- [ ] Test coverage improvement

## Testing
How did you test these changes? What test cases were added?

## Screenshots (if applicable)
Before / After screenshots for UI changes.

## Compliance Checklist
- [ ] Input validation on all new API endpoints (Zod)
- [ ] Authentication guard applied
- [ ] Audit log entries written for financial/HR/admin actions
- [ ] Feature flagged if incomplete
- [ ] No mock data on production paths
- [ ] No secrets in committed files

## Related Issues
Closes #
```

### Review Requirements

- Minimum **1 approving review** required before merge to `main`
- All automated checks (lint, typecheck, test, security scan) must be green
- Squash-merge preferred for feature branches; merge commit for release branches

---

## Code Standards

### TypeScript
- **Strict mode** is enabled — no `any`, no `@ts-ignore` without documented justification
- All exported functions and public interfaces must have JSDoc comments
- Prefer `type` over `interface` for plain data shapes; use `interface` for extensible contracts
- Use Zod schemas as the single source of truth for validation — derive TypeScript types from them

### API Design
- All routes follow RESTful conventions
- Use HTTP status codes correctly: `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `422` Validation Error, `501` Not Implemented
- Return consistent error shapes: `{ error: string, details?: ZodIssue[] }`
- All state-changing endpoints require authentication and write to the audit log
- Unimplemented endpoints MUST return `501 Not Implemented` — never return mock/fake data on production paths

### Database
- All schema changes go through Drizzle Kit migrations — no ad-hoc `ALTER TABLE` in code
- New tables and columns must have descriptive JSDoc on the schema object
- Avoid N+1 queries — use joins or batch fetches; validate with query logging in development
- Sensitive columns (SSN fragments, account numbers) must be encrypted at rest

### Frontend
- Components live in `client/src/components/` — keep them small, single-responsibility
- Use TanStack Query for all server state; avoid local state for data that belongs on the server
- All forms use React Hook Form + Zod resolvers — no uncontrolled inputs
- Every page must implement loading, error, and empty states
- Accessibility: interactive elements must have ARIA labels; test with keyboard-only navigation

---

## Testing Requirements

| Layer | Tool | Target Coverage |
|---|---|---|
| Unit (business logic) | Vitest | ≥ 90% |
| Integration (API routes) | Vitest + Supertest | ≥ 85% |
| Component (React) | Vitest + React Testing Library | ≥ 80% |
| E2E *(future)* | Playwright | Critical flows |

### Running Tests

```bash
npm run test                 # Run all tests
npm run test:coverage        # With coverage report
npm run test -- --watch      # Watch mode
npm run test -- path/to/file # Specific file
```

### Test File Conventions

- Test files live alongside the code they test: `feature.ts` → `feature.test.ts`
- Or in `tests/` for integration-level tests
- Mock external services (Stripe, Modern Treasury, etc.) — never call live APIs in tests
- Use `vi.mock()` for module-level mocks; prefer dependency injection for unit tests

---

## Security Requirements

All contributors must follow these security rules without exception:

1. **No secrets in source code** — use environment variables exclusively. `npm run secrets-scan` runs on every PR.
2. **Input validation on every endpoint** — use Zod schemas; never trust raw request data.
3. **Authentication on every non-public route** — apply the `requireAuth` middleware.
4. **Audit logging on all financial and HR mutations** — use `auditLog()` helper in storage layer.
5. **SQL injection prevention** — use Drizzle ORM parameterized queries exclusively; no raw SQL string concatenation.
6. **CSRF protection** — all state-changing form submissions include CSRF token.
7. **Dependency hygiene** — Dependabot alerts must be reviewed within 7 days; critical CVEs within 24 hours.

To report a security vulnerability, email **security@ofaps.spurs.gov** — do NOT open a public GitHub issue.

See [`SECURITY.md`](SECURITY.md) for the full vulnerability disclosure policy.

---

## AI Developer Guidelines

GOFAPS is explicitly designed for collaborative AI-assisted development. AI contributors are held to the same standards as human contributors, with these additional notes:

### Recommended Workflow

1. Browse issues labeled [`ai-ready`](../../labels/ai-ready) — these have complete acceptance criteria, technical context, and no ambiguous requirements.
2. Read the full issue, linked documentation, and any referenced files before writing code.
3. Implement the minimal correct change — avoid scope creep or unsolicited refactoring of unrelated code.
4. Write tests first (TDD) or alongside implementation — never submit untested code.
5. Run the full check suite before submitting: `npm run lint && npm run typecheck && npm run test`.
6. Summarize your approach, tradeoffs, and any assumptions in the PR description.

### AI-Specific Rules

- **Never hallucinate dependencies** — only use packages that are already in `package.json` or explicitly requested in the issue
- **Never remove feature flags** — if a flag exists, keep it; only toggle it with explicit instruction
- **Never stub production paths** — if you cannot fully implement something, return `501` and document it
- **Always handle error states** — loading, error, and empty states are required, not optional
- **Respect organization-level data isolation** — never write queries that could return cross-tenant data
- **No AI watermarking** — do not add comments like "Generated by AI" in production code

---

## Issue Labels

| Label | Meaning |
|---|---|
| `ai-ready` | Issue has complete spec and acceptance criteria; suitable for AI implementation |
| `good-first-issue` | Good entry point for new contributors |
| `bug` | Confirmed defect with reproduction steps |
| `enhancement` | New feature or capability request |
| `security` | Security vulnerability or hardening task |
| `compliance` | FISMA / NIST / FedRAMP / Section 508 requirement |
| `performance` | Latency, throughput, or resource optimization |
| `documentation` | Docs-only change |
| `blocked` | Cannot proceed; waiting on dependency or decision |
| `needs-triage` | Requires review by maintainer before work begins |
| `module:financial` | Financial management module |
| `module:hr` | Human resources & payroll module |
| `module:procurement` | Procurement & contracting module |
| `module:fleet` | Fleet & asset management module |
| `module:constituent` | Constituent & citizen services module |
| `module:analytics` | Analytics & reporting module |
| `module:ai` | AI / ATLANTIS.AI integration |

---

## Contact

| Channel | Details |
|---|---|
| **General Questions** | Open a [GitHub Discussion](../../discussions) |
| **Bug Reports** | Open a [GitHub Issue](../../issues) with the `bug` label |
| **Security Issues** | security@ofaps.spurs.gov *(do not use GitHub issues)* |
| **OFAPS Office** | gofap@ofaps.spurs.gov · (844) 697-7877 ext. 6327 |

---

*Maintained by the Office of Finance, Accounting & Personnel Services (OFAPS)*  
*US Department of Special Projects and Unified Response Services · spurs.gov*
