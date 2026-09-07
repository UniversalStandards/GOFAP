---
name: 🤖 AI-Ready Task
about: A fully-specified implementation task suitable for AI-assisted development
title: '[AI-READY] <short description>'
labels: 'ai-ready'
assignees: ''
---

> **This issue is tagged `ai-ready`.** It contains a complete specification with acceptance criteria, technical context, and no ambiguous requirements. AI contributors should be able to implement this end-to-end without clarification.

---

## Task Summary

One-paragraph description of exactly what needs to be built or fixed.

## Target Module

<!-- Select one -->
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
- [ ] ⚙️ Infra / Deployment

## Scope

**Files to create or modify:**

```
server/routes/
client/src/pages/
shared/schema.ts
...
```

**Files NOT to touch:**

```
// List files that are out of scope to prevent unintended changes
```

---

## Technical Specification

### Data Model Changes

```typescript
// Drizzle schema additions or modifications
// Example:
export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  // ...
});
```

### API Endpoints

```
GET    /api/<resource>            — List with pagination
GET    /api/<resource>/:id        — Get by ID
POST   /api/<resource>            — Create (body: CreateSchema)
PATCH  /api/<resource>/:id        — Update (body: UpdateSchema)
DELETE /api/<resource>/:id        — Soft delete
```

### Zod Validation Schemas

```typescript
// Define the expected input/output schemas
export const CreateSchema = z.object({
  // ...
});
```

### Frontend Components

```
client/src/pages/<PageName>.tsx    — Route-level page component
client/src/components/<Widget>.tsx — Reusable component
```

---

## Acceptance Criteria

Each criterion must be independently verifiable:

- [ ] 
- [ ] 
- [ ] 
- [ ] All new API endpoints validate input (Zod), require auth, write to audit log
- [ ] UI has loading, error, and empty states
- [ ] Unit tests written; coverage does not drop below current baseline
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` all pass

---

## Constraints

- Do NOT change any files outside the scope listed above
- Do NOT add new npm dependencies without explicit approval
- Do NOT return mock/placeholder data on production paths — use feature flags or return HTTP 501
- Do NOT introduce cross-tenant data access in any Drizzle query
- Sensitive fields (SSNs, account numbers) must be encrypted at rest

---

## Reference Material

- Related issue(s): #
- Related file(s): 
- External docs / API reference: 
- GOFAPS data model reference: [`shared/schema.ts`](../../shared/schema.ts)
- API conventions: [`CONTRIBUTING.md`](../../CONTRIBUTING.md#api-design)

---

## Testing Checklist (for PR)

- [ ] Unit tests for all new business logic
- [ ] Integration test for each new API endpoint
- [ ] Component test for each new React component
- [ ] Manual smoke test: end-to-end happy path verified
- [ ] Edge cases tested: empty state, validation errors, auth failure
