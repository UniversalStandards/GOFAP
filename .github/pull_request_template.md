## Summary

<!-- One paragraph describing what this PR does and why. Link to the issue(s) it closes. -->

Closes #

---

## Type of Change

- [ ] ✨ New feature (`feat`)
- [ ] 🐛 Bug fix (`fix`)
- [ ] 📖 Documentation (`docs`)
- [ ] ♻️ Refactor — no behavior change (`refactor`)
- [ ] 🔒 Security patch (`security`)
- [ ] 🧪 Test coverage improvement (`test`)
- [ ] ⚙️ Tooling / dependencies / config (`chore`)
- [ ] 🚀 Performance improvement (`perf`)

## Module(s) Affected

- [ ] 💰 Financial Management
- [ ] 👥 Human Resources & Payroll
- [ ] 🛒 Procurement & Contracting
- [ ] 🚗 Fleet & Asset Management
- [ ] 🏙️ Constituent Services
- [ ] 📊 Analytics & Reporting
- [ ] 🤖 AI / ATLANTIS.AI
- [ ] 🔒 Auth / Security
- [ ] 🌐 API / Backend
- [ ] 🖥️ Frontend / UI
- [ ] ⚙️ Infra / Deployment / CI

---

## Changes Made

<!-- Bullet-point summary of every meaningful change in this PR -->

- 
- 

## Screenshots (UI changes only)

| Before | After |
|---|---|
| | |

---

## Testing

**How was this tested?**

- [ ] Unit tests added / updated
- [ ] Integration tests added / updated
- [ ] Component tests added / updated
- [ ] Manual end-to-end smoke test performed
- [ ] Tested against real database (not mocked)

**Test commands run:**

```bash
npm run lint       # Result:
npm run typecheck  # Result:
npm run test       # Result: X passed, Y failed
```

**Coverage delta:** `before: __% → after: __%`

---

## GOFAPS Compliance Checklist

> All items must be checked (or explicitly N/A) before this PR can be merged.

### API & Data
- [ ] All new/modified API endpoints have Zod input validation
- [ ] All new/modified API endpoints require authentication (`requireAuth` middleware)
- [ ] All financial, HR, and admin mutations write to the audit log
- [ ] No raw SQL string concatenation — Drizzle ORM parameterized queries used throughout
- [ ] Organization-level data isolation maintained (no cross-tenant query risk)
- [ ] Sensitive columns (SSNs, account numbers) encrypted at rest — OR N/A

### Production Path Integrity
- [ ] No mock data or placeholder stubs on production code paths
- [ ] Unimplemented endpoints return `HTTP 501` with descriptive message — OR N/A
- [ ] Feature flags applied to incomplete UI routes or API paths — OR N/A

### Security
- [ ] No secrets, credentials, tokens, or PII committed to source
- [ ] `npm run secrets-scan` (or equivalent) run with no findings — OR N/A
- [ ] CSRF protection in place for any new state-changing forms — OR N/A

### Frontend
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state implemented
- [ ] Keyboard navigation and ARIA labels present on interactive elements — OR N/A

### Documentation
- [ ] Inline JSDoc added for all new exported functions and types
- [ ] CHANGELOG.md updated under `[Unreleased]`
- [ ] README.md updated if new module, endpoint, or configuration was added — OR N/A
- [ ] Deployment guide updated if infrastructure changed — OR N/A

---

## Deployment Considerations

- [ ] No environment variable changes
- [ ] No database migration required
- [ ] No infrastructure changes
- **OR** describe changes required below:

```
// New env vars, migration steps, infra changes, rollback plan
```

## Risk Assessment

**Risk level:** 🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical

**Rollback plan:** 

---

*By submitting this PR I confirm I have read [`CONTRIBUTING.md`](../CONTRIBUTING.md) and that all checklist items above are addressed.*
