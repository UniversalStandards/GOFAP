# Operations guide

## Pre-deployment

1. Select an environment-specific deployment target and confirm that it is isolated from development and staging.
2. Configure GitHub environment protection, required reviewers, least-privilege deployment credentials, and verified SSH host fingerprints.
3. Complete the [deployment checklist](../DEPLOYMENT_CHECKLIST.md).
4. Run the repository checks and first execute the deployment workflow in dry-run mode.
5. Record the release Git ref, database backup or recovery point, and rollback owner.

## Health and verification

| Endpoint | Interpretation |
|---|---|
| `GET /health` | Basic process liveness |
| `GET /health/live` | Explicit liveness probe |
| `GET /health/ready` | Dependency readiness, including database connectivity |
| `GET /health/detailed` | Detailed diagnostic data; restrict exposure in production |

A successful process start is not sufficient. Deployment succeeds only after readiness passes and a representative authenticated smoke test confirms the changed workflow.

## Logging and monitoring

Application logs are structured and include correlation identifiers. Set `LOG_LEVEL` and `LOG_DIR` per environment, ensure the process can write to the destination, and forward logs to the approved centralized system. Alert on repeated readiness failures, elevated server errors, authentication anomalies, and exhausted database connections.

Metrics, APM integration, distributed tracing, and formal performance thresholds remain readiness gaps. Track their delivery in the [`v0.1.x` roadmap](../ROADMAP.md#-currently-active--v01x-stabilization); do not infer monitoring coverage that has not been configured and tested.

## Rollback

The selected-platform workflow records the previous commit and attempts an automatic rollback if container startup or health verification fails. If manual intervention is required:

1. stop further deployments and notify the release owner;
2. preserve workflow, application, proxy, and database logs;
3. restore the last approved Git ref or immutable image;
4. restore data only under the documented database recovery procedure;
5. verify readiness and critical smoke tests; and
6. document the incident and required corrective actions before retrying.

Never perform an irreversible production data operation solely through automation; require explicit operator review.

## Process and proxy configuration

- [`ecosystem.config.js`](../ecosystem.config.js) configures PM2.
- [`gofaps.service`](../gofaps.service) configures systemd.
- [`nginx.conf`](../nginx.conf) provides the reverse-proxy baseline.
- [`DEPLOYMENT_WORKFLOW.md`](../DEPLOYMENT_WORKFLOW.md) documents workflow secrets and troubleshooting.
- [`SECURITY.md`](../SECURITY.md) defines vulnerability reporting.

Review every baseline against the target host, domain, certificate, secret manager, network policy, retention policy, and agency security requirements before production use.
