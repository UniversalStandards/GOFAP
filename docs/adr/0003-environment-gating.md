# ADR 0003: Sequential environment gates

- **Status:** Accepted
- **Date:** 2026-09-07
- **Owners:** GOFAPS release managers

## Context

Configuration, credentials, data, and risk differ between development, staging, and production. A successful build alone does not establish that a release is safe for financial workloads. Promotions need explicit evidence and accountable human decisions.

## Decision

Maintain three isolated GitHub Environments: `dev`, `staging`, and `production`. Promote the same immutable commit or image digest sequentially from development to staging to production; do not rebuild between gates when digest-based deployment is available.

| Gate | Entry evidence | Approval | Exit evidence |
|---|---|---|---|
| Development | CI passed; artifact identified | Development-team environment policy | Smoke tests and liveness/readiness pass |
| Staging | Development evidence; migration and rollback reviewed | Release manager | Integration, security, and representative workflow tests pass |
| Production | Staging evidence; change ticket; backup/restore point; monitoring and rollback owners assigned | Release manager, with production wait timer | Readiness, smoke tests, dashboards, and error budget remain healthy |

Environment-specific secrets are stored only in the corresponding GitHub Environment or approved secret manager. Production credentials are not available to development or pull-request jobs. Deployment jobs use least-privilege identities and GitHub OIDC where supported.

Production deployment remains a human-approved operation. An approver must not approve their own high-risk change without another qualified reviewer. Emergency promotion follows incident command, records the reason and approvers, and completes retrospective validation.

## Consequences

- Progressive validation limits blast radius and creates promotion evidence.
- Manual production approval prevents autonomous production changes.
- Sequential gates increase lead time and require disciplined artifact identification.
- Environment drift is possible; configuration must be managed as code and differences documented.

## Enforcement

The `environment-gates.yml` workflow expresses ordering, while GitHub Environment protection rules enforce reviewers and wait timers. The selected-platform deploy workflow must bind each job to the selected environment. Repository administrators audit the live settings quarterly because workflow YAML alone cannot enforce reviewer configuration.

## Alternatives considered

- **Direct production deployment after CI:** rejected because it lacks representative validation and human authorization.
- **Long-lived release branches per environment:** rejected because branches drift; promote immutable artifacts instead.
- **Automatic canary production:** a future option after automated rollback, service-level indicators, and traffic controls are proven.
