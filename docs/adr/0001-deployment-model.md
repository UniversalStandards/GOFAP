# ADR 0001: VM-based container deployment model

- **Status:** Accepted
- **Date:** 2026-09-07
- **Owners:** GOFAPS release managers

## Context

GOFAPS needs a deployment model that works consistently on the currently supported UpCloud, AWS EC2, and Azure VM targets. The repository already contains a Dockerfile, Docker Compose topology, NGINX configuration, host service definitions, and a manually dispatched GitHub Actions deployment workflow. The team needs explicit operational control while production automation matures.

## Decision

Deploy GOFAPS as Docker Compose services on a managed Linux VM behind NGINX. GitHub Actions is the control plane: an operator selects the platform, environment, and immutable git ref, and the environment gate supplies human approval. The target checkout is `/var/www/gofaps` by default.

The current workflow builds on the target host. Every deployment must record the resolved commit SHA, preserve the previous SHA, verify `/health/ready`, and roll back on failed health checks. PostgreSQL data is external to disposable application containers and follows an independent backup and restore policy.

Production changes are manually initiated; automation must never deploy to production without the GitHub `production` environment approval. Longer term, the preferred evolution is to build once in CI, scan the image, address it by digest, promote the same artifact through environments, and deploy without rebuilding.

## Consequences

### Positive

- One operating model supports all three VM providers.
- Containers reduce host-specific runtime drift.
- Manual dispatch, pinned refs, gates, and health checks provide auditable control.
- Operators retain a direct recovery path when CI/CD is unavailable.

### Negative and risks

- Building on each target can produce drift and consumes production capacity.
- VM patching, capacity, Docker lifecycle, and NGINX remain operator responsibilities.
- A single application VM can be a failure domain unless the environment adds redundant instances and load balancing.
- A schema migration may make application-only rollback unsafe.

## Guardrails

- Use an immutable release tag or full commit SHA for staging and production; do not deploy a moving branch head.
- Run CI, vulnerability scanning, backup verification, and the deployment dry run before approval.
- Keep environment secrets isolated and grant the deployment identity only the target-specific permissions it needs.
- Require a migration compatibility and rollback plan before deploying database changes.
- Follow the [deployment](../runbooks/deploy.md) and [rollback](../runbooks/rollback.md) runbooks.

## Alternatives considered

- **Managed container platform:** improves scaling and immutable deployment but adds a migration and provider-specific operational model.
- **Host-native Node.js/systemd:** simple but increases runtime drift and weakens artifact parity.
- **Kubernetes:** offers orchestration and resilience but is unjustified operational complexity at the current scale.
