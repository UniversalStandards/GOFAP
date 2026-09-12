# ADR 0001: Provider-oriented Terraform roots and isolated remote state

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

GOFAPS supports AWS, Azure, and UpCloud deployment, but its Terraform previously
covered only a multi-subscription Azure network and policy configuration. That layout
could not provision the documented AWS and UpCloud targets and coupled several Azure
environments to one state file and one blast radius.

## Decision

Maintain one independent Terraform root per provider under `infra/terraform`, with
identically named networking, security, and compute modules. Maintain explicit
`dev`, `staging`, and `production` variable overlays beneath every provider root.
Do not use Terraform workspaces for environment isolation.

Use the generic HTTP backend for every root so the organization can select an
approved state service without changing configuration. Give every provider and
environment a unique remote state address. Backend authentication is injected with
`TF_HTTP_USERNAME` and `TF_HTTP_PASSWORD`; provider credentials use provider-native
environment variables. CI creates a plan, retains it as an immutable review artifact,
and requires human approval before production apply.

## Consequences

A provider/environment failure or accidental change cannot directly corrupt another
state. Plans remain smaller and provider ownership is obvious. Module code is
repeated where cloud semantics differ, which is intentional: a false cross-cloud
abstraction would hide security and availability differences. Operators must
bootstrap the remote state service, replace the example backend hostname, and supply
`TF_VAR_ssh_public_key` and `TF_VAR_admin_cidrs` before planning.

The baseline creates one public VM for compatibility with current deployment guides.
Production evolution should add private compute, redundant zones, managed ingress,
monitoring, backups, and managed data services through separately reviewed ADRs.
