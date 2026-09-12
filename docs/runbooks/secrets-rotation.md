# Runbook: Secrets Rotation

## Purpose

Define repeatable procedures for rotating application and infrastructure secrets safely.

## Rotation Cadence

- Standard credentials: every 90 days.
- High-risk credentials (privileged, externally exposed): every 30 days.
- Immediate rotation upon suspected compromise.

## Procedure

1. Identify secret scope and dependent services.
2. Generate new credential in approved secrets manager.
3. Deploy updated secret to non-production environment and validate.
4. Promote secret update to production during maintenance window.
5. Confirm service health and authentication success.
6. Revoke previous credential after successful validation.
7. Record rotation timestamp, owner, and ticket reference.

## Safety Controls

- Never store plaintext secrets in source control.
- Use least-privilege credentials for each component.
- Roll credentials in phases to avoid simultaneous outages.

## Emergency Rotation

If compromise is suspected:

1. Rotate immediately.
2. Invalidate old credentials.
3. Review access logs for anomalous usage.
4. Initiate incident response process.
