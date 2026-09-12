# ADR 0002: Protected, review-based integration strategy

- **Status:** Accepted
- **Date:** 2026-09-07
- **Owners:** GOFAPS maintainers

## Context

The default and release branches can alter financial workflows, authentication, infrastructure, and production automation. Direct or unverified changes create an unacceptable integrity and auditability risk.

## Decision

Protect `main` and `release/**` and require pull requests. Require two approving reviews, including code-owner review; dismiss stale approvals; require resolved conversations and signed commits. Administrators are subject to the same policy. Force pushes and branch deletions are prohibited.

Require the repository checks configured in `.github/settings.yml`: type checking, PR check, test, lint, and build-artifact validation. Checks must run against the latest target branch state. Prefer squash merges for a focused history; rebase merges are allowed when commits are already coherent and signed. Merge commits are disabled, and merged topic branches are deleted.

Emergency changes use the hotfix pull-request path and receive the same checks and review count. If GitHub is impaired, changes wait unless the incident commander declares that delay creates a greater active impact. Any exceptional repository-policy override requires two-person authorization, an audit record, and a retrospective pull request within one business day.

## Consequences

- Independent review and automated checks reduce regressions and create an auditable chain of custody.
- Code-owner review routes sensitive changes to accountable teams.
- Two reviews can slow urgent changes; the documented incident exception manages that risk without creating a routine bypass.
- Repository administrators must keep ruleset check names synchronized with workflow job names.

## Verification

Quarterly, repository administrators compare live GitHub rulesets and environments with `.github/settings.yml`, confirm CODEOWNERS teams have active members, and save audit evidence. A ruleset configuration file is declarative intent, not proof that GitHub has applied it.

## Alternatives considered

- **One approval:** faster, but insufficient separation of duties for financial and production changes.
- **Direct pushes by administrators:** convenient during incidents, but weakens controls and attribution.
- **Merge queue:** desirable as concurrency increases; deferred until repository activity warrants its operating cost.
