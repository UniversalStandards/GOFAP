# ADR-001: Deployment Model

- **Status:** Accepted
- **Date:** 2026-02-23
- **Deciders:** Platform Engineering, Security, Operations

## Context

GOFAPS supports mission-critical government workflows and requires controlled rollouts, quick rollback paths, and strong auditability. A single in-place deployment strategy increases blast radius during releases and complicates verification.

## Decision

Adopt a **blue-green deployment model** for production releases:

- Maintain two production environments (`blue` and `green`) with identical infrastructure and configuration.
- Route external traffic through a single controlled ingress layer (load balancer/reverse proxy).
- Deploy new application versions to the inactive environment.
- Execute smoke tests and health checks before traffic cutover.
- Shift traffic atomically to the new environment when checks pass.
- Keep the previous environment intact for immediate rollback.

## Consequences

### Positive

- Reduces release risk by validating before customer impact.
- Enables near-immediate rollback by switching traffic back.
- Improves operational confidence for frequent updates.

### Negative

- Requires additional infrastructure capacity.
- Increases operational complexity around environment parity.
- Requires strict configuration management to prevent drift.

## Implementation Notes

- The CI/CD pipeline must support targeting inactive environments and cutover actions.
- Health checks must include application readiness and dependency checks.
- Database migrations must be backward compatible during cutover windows.
