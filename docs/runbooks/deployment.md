# Runbook: Deployment

## Purpose

Define the standard deployment workflow for GOFAPS using the approved release process.

## Preconditions

- Release candidate commit is merged to the protected release branch.
- All required CI checks are green.
- Change request and release notes are available.
- Deployment window is approved.

## Procedure

1. Confirm target version (commit SHA, artifact version).
2. Deploy to inactive production environment (`blue` or `green`).
3. Run smoke tests:
   - Health endpoint checks
   - Authentication flow validation
   - Core API request validation
4. Verify observability signals (error rate, latency, saturation) are within baseline.
5. Execute traffic cutover at ingress.
6. Monitor for 30 minutes with heightened alerting.
7. Announce release completion in operations channel.

## Validation Checklist

- `/api/health` returns HTTP 200.
- Error rate remains below agreed threshold.
- Critical business transactions complete successfully.
- No Sev-1 or Sev-2 alerts fire after cutover.

## Escalation

- If health checks fail: stop cutover and notify on-call engineer.
- If post-cutover degradation is detected: initiate rollback runbook.
