# Incident Response Runbook

## Scope and priorities

Use this runbook for availability, security, privacy, integrity, and financial-processing incidents. Priorities are life and safety, containment, data and transaction integrity, service restoration, evidence preservation, and timely communication. Do not expose credentials, personal data, financial data, or exploit details in public channels.

## Severity

| Severity | Example | Initial response target |
|---|---|---|
| SEV-1 | Confirmed compromise; incorrect/duplicate financial transactions; broad outage; material data loss | Page immediately; acknowledge within 15 minutes |
| SEV-2 | Major feature or environment degraded; elevated errors with no safe workaround | Acknowledge within 30 minutes |
| SEV-3 | Limited impact with a safe workaround | Triage within one business day |

When uncertain, choose the higher severity until impact is understood.

## First 15 minutes

1. Open a restricted incident channel and incident record. Record detection source, UTC start/detection times, symptoms, affected environments/tenants, and reporter.
2. Assign incident commander, operations lead, communications lead, and scribe. One person may hold multiple roles initially, but the commander should not perform every technical action.
3. Page the application and infrastructure on-call. Add database, identity, payment, privacy, legal, or security owners based on impact.
4. Freeze deployments and unrelated production changes. Preserve workflow output and relevant logs.
5. Validate from trusted telemetry: liveness/readiness, 5xx and latency, authentication failures, database health, resource saturation, recent deployments, and provider status.
6. Establish an update cadence: every 30 minutes for SEV-1, every 60 minutes for SEV-2.

## Contain, eradicate, recover

- Prefer reversible containment: disable an affected feature/provider, remove an unhealthy instance, pause a worker, revoke a compromised credential, or block a malicious source at the edge.
- For financial anomalies, stop the affected transaction path, preserve idempotency/audit records, notify the payment owner, and reconcile with the provider before replaying work.
- For suspected compromise, avoid destroying evidence. Capture timestamps, release SHA, identities, configuration metadata, and log references; restrict access and follow the security response process in `SECURITY.md`.
- Roll back a causal release using the [rollback runbook](rollback.md) only after checking schema and external side effects.
- Rotate exposed secrets using the [secret rotation runbook](secret-rotation.md). Assume copied secrets remain compromised after removal.
- Restore traffic gradually. Verify critical flows and control totals, monitor error and latency signals, and obtain incident commander approval before declaring recovery.

## Communication

Every update states severity, confirmed customer impact, affected capabilities, actions in progress, current workaround, next update time, and owner. Separate facts from hypotheses. Communications to customers, regulators, law enforcement, or media require the authorized communications/legal path. Meet applicable contractual and statutory notification deadlines; the incident commander must engage privacy/legal counsel rather than infer a deadline.

## Resolution and learning

Resolution requires stable service, contained security risk, reconciled transactions/data, cleared or safely retained queues, and an identified monitoring owner. Record recovery time and supporting evidence.

For SEV-1 and SEV-2, schedule a blameless review within five business days. Document timeline, impact, detection gaps, contributing conditions, what worked, and owned corrective actions with due dates. Preserve evidence according to retention and legal-hold requirements, and review alert thresholds and runbooks.
