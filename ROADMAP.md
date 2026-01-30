# GOFAPS 6-Hour Acceleration Plan

This roadmap organizes parallel work streams to reach a minimally fully functional release within **6 hours**. Each stream maps to GitHub issues with clear owners, dependencies, and acceptance criteria. Time blocks assume 30-minute check-ins and continuous Slack updates. Prioritize risk reduction first: environment readiness, critical bugs, and core user flows.

## 0. Pre-flight (15 minutes)
- Create GitHub project board with swimlanes: Environment, Backend, Frontend, QA, Docs/DevEx, Release.
- Assign engineers for each lane; designate a release captain and QA lead.
- Start CI on the current `main` to surface baseline failures.

## 1. Environment & DevEx (Owner: DevEx) — 1 hour (parallel)
- **Issue:** Fix `.env.example` and `server/env-validator` to include Replit OIDC issuer/client IDs, Neon URL, and `SESSION_SECRET`. Add comments for local vs. production.
- **Issue:** Update `DEVELOPMENT.md` and `readme.md` to remove “100% complete” claims and point to this repo (not the legacy URL). Add quick-start commands for `npm run dev` and `npm run test`.
- **Issue:** Align `docker-compose.yml` and `Dockerfile` with the actual build (Express + Vite). Verify `npm run build` artifacts and expose `SESSION_SECRET` in compose overrides.
- **Deliverable:** New PR with passing `npm run lint`/`npm run test` and validated `.env.example`.

## 2. Backend Core (Owner: Backend) — 2 hours (parallel)
- **Issue:** Harden enhanced routes: require `organizationId` params, remove mock returns, and gate unfinished endpoints behind a feature flag. Prefer disabling unreachable services instead of shipping broken mocks.
- **Issue:** Add validation to bulk upload routes and integrate streaming CSV parsing; persist results to Drizzle.
- **Issue:** Expand `env-validator` to cover all required secrets and fail fast on missing values.
- **Issue:** Add analytics safe-guards (no divide-by-zero) and basic rate limiting on public APIs.
- **Deliverable:** All `/api` endpoints return real data or are explicitly disabled with 501 + message; integration tests updated.

## 3. Frontend Core (Owner: Frontend) — 2 hours (parallel)
- **Issue:** Hide nav links for unimplemented routes (`/settings`, `/integrations`, card/direct deposit flows) behind feature flags.
- **Issue:** Replace static data in reports, card management, direct deposits, and notification center with real API calls. Add empty/loading/error states.
- **Issue:** Wire WebSocket hook to new backend events (or temporarily poll) for employee dashboard notifications.
- **Deliverable:** Dashboard, payments, budgets, vendors, expenses, wallets, reports, and card/direct deposit pages load real data or show graceful fallbacks.

## 4. QA & Test Coverage (Owner: QA) — 1.5 hours (parallel)
- **Issue:** Raise coverage toward 90%: add Vitest suites for enhanced routes, bulk uploads, and frontend report/card flows. Mock WebSocket events.
- **Issue:** Add lint/typecheck to CI; ensure `npm run lint`, `npm run test`, and `npm run typecheck` gates.
- **Issue:** Add performance smoke: simple k6 or autocannon script hitting critical endpoints.
- **Deliverable:** CI green with coverage report uploaded; performance baseline captured in PR comment.

## 5. Observability & Security (Owner: Platform) — 1 hour (parallel)
- **Issue:** Enable structured logging and basic metrics (request counts/latency) via middleware; expose `/health/ready` and `/metrics` (if allowed) with auth guard.
- **Issue:** Add helmet/cors hardening and rate limiting defaults.
- **Issue:** Add audit logging hooks for payments/vendor changes in storage layer.
- **Deliverable:** Logs + metrics visible locally; security headers verified with smoke tests.

## 6. Release & Handoff (Owner: Release) — 30 minutes
- Merge PRs after reviews; run full test suite on `main`.
- Cut `v0.1.0` tag; build Docker image; publish to registry (or attach artifact).
- Update `IMPLEMENTATION_SUMMARY.md` with completed items and known follow-ups.

## Risk Management & Dependencies
- Critical path: Environment fixes → backend stability → frontend wiring → tests.
- If enhanced routes slip, feature-flag them off to avoid blocking release.
- Keep a rolling 30-minute risk review; raise blockers immediately to the release captain.

## Tracking & Communication
- Use GitHub Issues for each bullet, linked to the project board. Include clear acceptance criteria and owners.
- Standups at T+0:30, T+2:00, and T+4:00 with final go/no-go at T+5:30.
- Maintain a changelog in the PR body summarizing merged workstreams.

## Success Criteria (by T+6:00)
- All core finance CRUD flows working with real data; no placeholder mocks in production paths.
- Test suite ≥90% coverage; lint/typecheck clean.
- Dockerized app starts with documented `.env` and passes health checks.
- Navigation shows only supported pages; unimplemented features are feature-flagged or return 501.
