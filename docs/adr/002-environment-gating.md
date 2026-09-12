# ADR-002: Environment Gating Policy

- **Status:** Accepted
- **Date:** 2026-02-23
- **Deciders:** Platform Engineering, Security, QA

## Context

GOFAPS requires clear controls between development, staging, and production to ensure compliance, limit accidental promotion, and enforce quality gates for each release.

## Decision

Adopt a **progressive environment gating policy**:

1. **Development**
   - Any merged change can deploy automatically.
   - Feature branches use isolated ephemeral environments when available.
2. **Staging**
   - Promotion requires successful CI checks and passing automated integration tests.
   - Manual approval from an authorized reviewer is required for release candidates.
3. **Production**
   - Promotion requires successful staging validation and explicit release approval.
   - Deployments are restricted to approved release windows except emergency procedures.

## Consequences

### Positive

- Enforces release discipline and traceability.
- Reduces risk of unvalidated changes reaching production.
- Supports compliance and audit requirements.

### Negative

- Adds lead time for production promotion.
- Requires on-call or release manager availability for approvals.

## Policy Requirements

- Environment-specific credentials and secrets are isolated.
- Production data is never used directly in lower environments.
- Every promotion records commit SHA, approver, and timestamp.
