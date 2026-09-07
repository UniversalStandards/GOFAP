# Deployment Runbook

## Purpose and authority

Use this runbook to deploy an approved GOFAPS release to `dev`, `staging`, or `production` through the **Deploy (Selected Platform)** GitHub Actions workflow. Only release managers may execute production deployments. A human must approve any production-affecting action.

## Preconditions

- Approved pull request merged under the branch-protection policy.
- Immutable release tag or full commit SHA identified; CI, tests, lint, type checks, build, and vulnerability scan passed.
- Change ticket includes owner, scope, risk, user impact, maintenance window, and rollback decision criteria.
- Target environment secrets and GitHub environment reviewers are configured and isolated.
- Database changes have a reviewed forward/backward compatibility plan. A recent backup exists and its restore procedure has been tested.
- Incident channel, dashboard, logs, and on-call contacts are available. The previous known-good SHA is recorded.

## Procedure

1. Announce the deployment and change ticket in the operations channel. Assign a deployer and a separate observer.
2. Open **Actions → Deploy (Selected Platform) → Run workflow**.
3. Select the platform and environment, enter the immutable git ref, keep **dry run** enabled, and dispatch.
4. Review validation output. Confirm target, resolved SHA, host fingerprint, required secrets, and intended changes. Output must not disclose secret values.
5. Deploy to `dev`. Verify the checks below, then repeat with the identical ref in `staging`.
6. In staging, exercise login/logout, current-user lookup, one read-only organization-scoped flow, and the release-specific critical path. Confirm dashboards and logs show no regression.
7. Obtain the GitHub `production` environment approval. Reconfirm the SHA, backup, rollback owner, expected impact, and change window. Set **dry run** to false and dispatch production.
8. Watch workflow output without copying credentials or session data. Do not run concurrent deployments to the same platform and environment.
9. Complete post-deployment verification and observe for at least 15 minutes (longer when the change ticket requires it).
10. Record workflow URL, environment, platform, SHA, timestamps, approvers, health results, and outcome in the change ticket. Announce completion.

## Verification

Set the URL explicitly and do not use a production URL by default:

```bash
export BASE_URL=https://staging.example.gov
curl --fail-with-body --silent --show-error "$BASE_URL/health/live"
curl --fail-with-body --silent --show-error "$BASE_URL/health/ready"
```

Confirm all of the following:

- Liveness and readiness return HTTP 200 from more than one observation point.
- The deployed SHA matches the approved release.
- OIDC login, `GET /api/auth/user`, and logout succeed with a test account.
- Release-specific smoke tests pass; 5xx rate, p95 latency, database connections, CPU, memory, and disk remain within established baselines.
- No new high-severity security, payment, or authentication errors appear in sanitized logs.

## Abort and rollback criteria

Stop promotion or invoke the [rollback runbook](rollback.md) if readiness fails, error rate or latency breaches the service alert threshold for five minutes, authentication or a critical financial flow fails, data integrity is uncertain, or the incident commander/deployment observer requests it. Do not continue deployment merely to gather more evidence.

## Escalation

If automated rollback fails, declare an incident, remove the unhealthy target from service where possible, preserve logs and workflow output, and page the on-call application, database, and release owners. Never repair production data ad hoc without an approved recovery plan and audit record.
