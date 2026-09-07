# Rollback Runbook

## Purpose

Restore the last known-good application release when deployment verification fails or production behavior regresses. Rollback is a production change and requires explicit human authorization, except when an already-approved deployment workflow automatically restores its recorded prior SHA.

## Before acting

1. Open or update the incident/change record and name the incident commander, rollback operator, and observer.
2. Record environment, platform, failing SHA, previous known-good SHA, symptoms, timestamps, and dashboards.
3. Determine whether the release included database migrations, irreversible jobs, external side effects, or changed secrets. **Do not perform an application-only rollback when the old code cannot read the current schema.** Use the reviewed migration recovery plan or roll forward.
4. Preserve relevant application, proxy, database, and workflow logs without including secrets or regulated data.

## Automated path

The selected-platform deployment workflow records the prior commit and attempts to restore it when container startup or health validation fails. Verify the workflow-selected SHA against the change record; do not assume the automated attempt succeeded.

## Controlled manual path

Run these commands only on the confirmed target host after approval. Replace the example SHA with the recorded immutable known-good SHA.

```bash
cd /var/www/gofaps
git fetch --all --prune
git cat-file -e "<KNOWN_GOOD_SHA>^{commit}"
git checkout --detach <KNOWN_GOOD_SHA>
docker compose up -d --build
docker compose ps
curl --fail-with-body --retry 6 --retry-delay 5 http://localhost:5000/health/ready
```

If the deployment uses promoted registry artifacts, deploy the recorded digest instead of rebuilding. Never use a moving `latest` tag as rollback evidence.

## Database recovery

- Prefer backward-compatible migrations and application rollback without reversing schema.
- If a down migration is explicitly reviewed and tested, take a fresh backup before executing it and record its checksum/location.
- For destructive or uncertain migrations, stop writes, involve the database owner, and restore to a new database instance or point in time. Validate record counts and financial control totals before switching traffic.
- Reconcile external payment/provider operations separately; restoring a database does not reverse an external transaction.

## Verification and closeout

Verify `/health/live` and `/health/ready`, the deployed SHA/digest, login, a read-only organization flow, and the affected critical workflow. Confirm metrics stabilize for at least 15 minutes and queued jobs are safe before restoring normal traffic.

Keep the incident open if integrity is uncertain. Record commands, operators, approvals, start/end times, verification evidence, and residual risks. Create follow-up work for root-cause analysis and for a safer roll-forward release; do not immediately redeploy the failed release.

## Failure escalation

If rollback fails twice, readiness remains unhealthy, or data integrity is at risk, stop repeated changes. Keep or place the service in maintenance mode, page application/database/infrastructure owners, notify security for suspected compromise, and continue under the [incident response runbook](incident-response.md).
