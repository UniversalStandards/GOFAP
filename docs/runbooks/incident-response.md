# Runbook: Incident Response

## Purpose

Standardize incident handling to reduce impact and speed service recovery.

## Severity Guidelines

- **Sev-1:** Complete outage or critical security event.
- **Sev-2:** Major functionality degraded with significant user impact.
- **Sev-3:** Partial degradation with workaround available.

## Response Workflow

1. Acknowledge alert and open incident channel.
2. Assign incident commander and communications lead.
3. Stabilize service by reducing blast radius:
   - Roll back recent releases if needed.
   - Disable risky feature flags if applicable.
   - Rate-limit noncritical workloads if saturation is observed.
4. Communicate status updates every 15 minutes for Sev-1/Sev-2.
5. Resolve incident and verify recovery with service checks.
6. Publish post-incident summary with corrective actions.

## Evidence and Audit Trail

Capture:

- Start/end timestamps
- Systems impacted
- Detection source
- Actions taken and by whom
- Customer/user impact summary
