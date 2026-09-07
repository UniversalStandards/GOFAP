# Secret Rotation Runbook

## Scope and safety

Use this procedure for scheduled rotation or suspected exposure of database credentials, session secrets, OIDC credentials, provider/API keys, SSH keys, host fingerprints, and cloud identities. Production rotation requires a human-approved change or active incident authorization. Never paste secret values into tickets, chat, shell history, workflow inputs, logs, or source control.

## Standard rotation

1. **Inventory and plan.** Identify the secret owner, issuing system, environments, consumers, scopes, expiry, dependent workflows, and revocation mechanism. Determine whether the provider supports two simultaneously valid credentials.
2. **Open a change record.** Document identifiers/versions—not values—plus operator, observer, test plan, rollback plan, maintenance window, and affected services.
3. **Create least-privilege replacement.** Generate it in the approved secret manager/provider, with the shortest practical lifetime and only required scopes. For SSH, generate a new key pair and verify the server host key through a trusted channel.
4. **Distribute safely.** Update the environment-specific GitHub Environment secret and target secret store. Avoid repository-wide secrets when an environment-scoped secret is sufficient. Do not write plaintext secret files to persistent disk.
5. **Deploy/restart one environment at a time.** Validate in `dev`, then `staging`, then obtain production approval. Where dual credentials are supported, add the new credential before removing the old one.
6. **Verify.** Confirm readiness, authentication or provider connectivity, scheduled jobs, error rate, and audit logs. Ensure logs contain no secret material.
7. **Revoke old credential.** Revoke it at the issuing system, remove all old copies, and verify attempts with the old identifier fail. Do not revoke first unless active compromise requires immediate containment.
8. **Close.** Record version/identifier, systems updated, timestamps, operators, approvals, validation, revocation evidence, next rotation date, and any exceptions.

## Secret-specific notes

| Secret | Rotation considerations |
|---|---|
| `SESSION_SECRET` | Changing it invalidates all sessions. Schedule user communication, update every instance consistently, restart, verify login/logout, then confirm old cookies fail. |
| `DATABASE_URL` / database password | Create a new database role/password with equivalent least privilege, update consumers and connection pools, verify reads/writes and sessions, then revoke the old credential and monitor failed logins. |
| OIDC client credential | Add the new credential/provider configuration, verify login, callback, refresh, and logout on every domain, then revoke the old credential. |
| Payment/API key | Verify scopes and idempotency behavior with a non-destructive provider check. Monitor provider audit logs and reconcile transactions before revocation. |
| Deployment SSH key | Install the new public key, verify a fresh connection with pinned host fingerprint, update the platform-specific GitHub secret, then remove the old public key. |
| Cloud identity | Prefer short-lived OIDC federation. Review role assignments and audit logs before replacing or removing any long-lived fallback credential. |

## Exposure response

For suspected exposure, declare a security incident, identify blast radius through audit logs, stop or isolate the affected integration when safe, issue a replacement, and revoke the exposed credential as soon as continuity permits. Rotate derived or adjacent credentials if compromise may have crossed boundaries. Preserve evidence; deleting the source alone is not remediation, and git history rewriting requires security and repository-owner coordination.

## Rollback

If the replacement fails and the former credential is not suspected compromised, temporarily restore the former credential, validate service, and keep the change record open. If compromise is suspected, never reactivate the old secret: disable the integration or use a separately generated emergency credential while responders investigate.
