# Architecture

## Runtime components

The browser application is built with React, TypeScript, Vite, Wouter, TanStack Query, React Hook Form, and Radix-based UI components. It calls an Express application that owns authentication, request validation, API routing, provider orchestration, and persistence. The server also serves the built client in production.

PostgreSQL is accessed through Drizzle ORM. Types and Zod schemas in `shared/` form the contract boundary shared by browser and server code. Optional external integrations are implemented as services and providers under `server/services/`.

## Request flow

```text
HTTP request
  → proxy and security headers
  → request correlation and structured logging
  → rate limiting, authentication, and input validation
  → route or service
  → Drizzle storage and/or configured external provider
  → normalized JSON response
```

Public health routes intentionally bypass user authentication. Business routes must apply the appropriate authentication and authorization middleware and validate untrusted input at the boundary.

## Data domains

The shared schema models users and organizations alongside operational entities such as wallets, budgets, vendors, payments, expenses, transactions, employees, and workflows. Route handlers should delegate persistence to the storage layer and provider-specific behavior to service adapters.

## Security model

- Session-backed authentication is configured through OIDC.
- Server middleware supplies security headers, CORS controls, request limits, CSRF protection, and rate limiting.
- `SESSION_SECRET` is mandatory and validated at startup.
- Integration credentials are environment configuration and must never be committed.
- Structured logs and correlation identifiers support investigation; sensitive values must not be logged.

These controls are implementation inputs, not proof of regulatory certification. Agency-specific threat modeling, control testing, and authorization remain required.

## Build and deployment

`npm run build` produces Vite client assets and an esbuild server bundle under `dist/`. Docker provides the portable runtime boundary. GitHub Actions can build and scan images separately from manual host deployment, while PM2, systemd, and NGINX configurations support VM operation.

The current selected-platform deployment workflow builds on the target host. This simplifies registry requirements but increases deployment time and makes build reproducibility dependent on the host. The preferred future direction is promotion of a CI-built, scanned image by immutable digest; follow that work in the [roadmap](../ROADMAP.md).

## Architectural references

- [`shared/schema.ts`](../shared/schema.ts) — primary data schema
- [`server/index.ts`](../server/index.ts) — application composition and lifecycle
- [`server/security-middleware.ts`](../server/security-middleware.ts) — HTTP security controls
- [`server/health-check.ts`](../server/health-check.ts) — liveness and readiness behavior
- [`server/services/`](../server/services/) — provider and domain services
- [`docker-compose.yml`](../docker-compose.yml) — container topology

