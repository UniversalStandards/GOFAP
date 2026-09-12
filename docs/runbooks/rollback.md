# Runbook: Rollback

## Purpose

Provide a fast, safe procedure to restore service after a failed release.

## Rollback Triggers

- Sustained error rate increase above SLO threshold.
- Critical endpoint failures during or after deployment.
- Data integrity concerns linked to the latest release.

## Procedure

1. Declare rollback in incident/operations channel.
2. Switch ingress traffic back to previously stable environment.
3. Confirm rollback success with health and smoke checks.
4. Pause further deploys until root cause analysis is complete.
5. Capture release metadata (version, time, trigger, owner).

## Post-Rollback Actions

- Open incident ticket with timeline and impact.
- Assign engineering owner for corrective action.
- Add regression test coverage for identified failure mode.
- Schedule redeploy only after remediation approval.
