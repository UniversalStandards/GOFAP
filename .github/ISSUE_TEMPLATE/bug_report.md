---
name: 🐛 Bug Report
about: Report a defect in GOFAPS — financial, HR, procurement, or infrastructure
title: '[BUG] <short description>'
labels: 'bug, needs-triage'
assignees: ''
---

## Bug Description

Provide a clear, concise description of the defect and its observed impact.

---

## Module / Area

<!-- Select the affected GOFAPS module -->
- [ ] 💰 Financial Management (GL, budgets, AP/AR, treasury)
- [ ] 👥 Human Resources & Payroll
- [ ] 🛒 Procurement & Contracting
- [ ] 🚗 Fleet & Asset Management
- [ ] 🏙️ Constituent Services
- [ ] 📊 Analytics & Reporting
- [ ] 🤖 AI / ATLANTIS.AI Integration
- [ ] 🔒 Authentication & Security
- [ ] 🗄️ Database / ORM
- [ ] 🌐 API / Backend Routes
- [ ] 🖥️ Frontend / UI
- [ ] ⚙️ Infrastructure / Deployment
- [ ] 📦 Dependencies / Build

## Severity

<!-- Select the severity level -->
- [ ] 🔴 **Critical** — Data loss, security breach, or complete service outage
- [ ] 🟠 **High** — Core financial or HR functionality broken; no workaround
- [ ] 🟡 **Medium** — Non-critical functionality broken; workaround exists
- [ ] 🟢 **Low** — Minor visual or UX issue; no functional impact

---

## Environment

| Field | Value |
|---|---|
| **GOFAPS Version / Commit SHA** | |
| **Deployment Target** | AWS EC2 / Azure VM / UpCloud / Vercel / Local |
| **Node.js Version** | |
| **Browser (if frontend)** | |
| **OS** | |

---

## Steps to Reproduce

1. 
2. 
3. 

## Expected Behavior

Describe what should have happened.

## Actual Behavior

Describe what actually happened. Include error messages verbatim.

## Error Output / Logs

```
// Paste relevant logs, stack traces, or console output here
// Remove any sensitive data (credentials, PII, account numbers) before pasting
```

## Screenshots / Screen Recording

<!-- Attach screenshots or a screen recording if applicable -->

---

## Impact Assessment

<!-- Describe who is affected and how many users/transactions are impacted -->

- **Users affected**: 
- **Data integrity risk**: Yes / No
- **Audit trail affected**: Yes / No
- **Financial accuracy affected**: Yes / No

---

## Additional Context

<!-- Any other context, related issues, or potential root cause hypotheses -->

---

> ⚠️ **Security Note:** If this bug involves a potential security vulnerability (authentication bypass, data exposure, injection, etc.), do NOT file it here. Email **security@ofaps.spurs.gov** instead.
