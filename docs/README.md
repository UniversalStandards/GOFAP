# GOFAPS Documentation

This directory contains the maintained engineering and operations documentation for GOFAPS.

## Architecture

- [System architecture](architecture/README.md)
- [ADR 0001: Deployment model](adr/0001-deployment-model.md)
- [ADR 0002: Branch protection strategy](adr/0002-branch-protection-strategy.md)
- [ADR 0003: Environment gating](adr/0003-environment-gating.md)

## API

- [OpenAPI 3.1 specification](api/openapi.yaml)
- [API documentation and authentication guide](api/README.md)

## Operations

- [Deployment runbook](runbooks/deploy.md)
- [Rollback runbook](runbooks/rollback.md)
- [Incident response runbook](runbooks/incident-response.md)
- [Secret rotation runbook](runbooks/secret-rotation.md)

Documentation changes follow the same review and branch-protection requirements as application changes. Operational commands are examples: operators must confirm the target environment and obtain the approvals described in the relevant runbook before changing production.
