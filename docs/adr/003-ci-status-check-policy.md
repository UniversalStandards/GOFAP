# ADR-003: CI Status-Check Policy

- **Status:** Accepted
- **Date:** 2026-02-23
- **Deciders:** Engineering Leadership, Platform Engineering

## Context

Repository quality and security depend on consistent validation before merges. Optional checks create inconsistent standards and increase defect leakage.

## Decision

Require the following **mandatory CI status checks** on pull requests targeting protected branches:

- Lint and formatting validation.
- Type checking.
- Unit and integration test suites.
- Dependency vulnerability scan.
- Build verification for client and server artifacts.

A pull request can merge only when all required checks pass and required approvals are present.

## Consequences

### Positive

- Creates consistent code quality baseline.
- Catches regressions earlier in the lifecycle.
- Strengthens software supply chain controls.

### Negative

- Increases CI runtime and infrastructure spend.
- May delay urgent fixes if pipelines are unstable.

## Operational Guardrails

- Failing required checks block merges by default.
- Temporary bypasses require documented incident references and follow-up remediation.
- Changes to required checks must be approved by platform owners.
