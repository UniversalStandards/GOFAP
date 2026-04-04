---
name: 🔒 Security Issue (Non-Sensitive)
about: For non-sensitive security improvements only. DO NOT use for active vulnerabilities.
title: '[SECURITY] <short description>'
labels: 'security'
assignees: ''
---

> ⚠️ **STOP — Read Before Filing**
>
> This template is ONLY for **non-sensitive security improvements** (e.g., adding a missing security header, upgrading a vulnerable dependency that is already publicly disclosed, hardening a configuration).
>
> **If you have found an actual security vulnerability** — an authentication bypass, data exposure, injection point, privilege escalation, or any issue that could be exploited — do NOT file it here.
> Email **security@ofaps.spurs.gov** immediately with a private disclosure.

---

## Security Improvement Description

Describe the non-sensitive security hardening or improvement being proposed.

## Category

- [ ] Dependency upgrade (CVE publicly disclosed, fix available)
- [ ] Missing or misconfigured security header
- [ ] Rate limiting improvement
- [ ] Input validation gap
- [ ] CORS misconfiguration
- [ ] Session management hardening
- [ ] Audit logging gap
- [ ] RBAC / permission gap
- [ ] Infrastructure hardening
- [ ] Other (describe below)

## Current State

Describe the current (insecure or suboptimal) behavior.

## Proposed Improvement

Describe the specific change needed.

## CVE / Advisory Reference (if applicable)

```
CVE-XXXX-XXXXX
https://github.com/advisories/GHSA-...
```

## Impact of NOT Fixing

Describe the risk level and potential consequences if this is not addressed.

## Suggested Fix

```typescript
// Code snippet or configuration change if known
```

---

## Compliance Implications

- [ ] NIST SP 800-53 control affected (specify): 
- [ ] FedRAMP requirement affected
- [ ] PCI DSS requirement affected
- [ ] No compliance implications

---

> **Reminder:** Active vulnerabilities go to **security@ofaps.spurs.gov** — not here.
