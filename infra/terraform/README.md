# GOFAPS Terraform infrastructure

This directory contains independently deployable roots for every supported cloud:

| Provider | Root | Baseline resources |
| --- | --- | --- |
| AWS | [`aws/`](aws/) | VPC/subnet, security group, EC2 instance |
| Azure | [`azure/`](azure/) | resource group/VNet/subnet, NSG, Linux VM |
| UpCloud | [`upcloud/`](upcloud/) | SDN network, firewall rules, server |

Each root composes the same three module boundaries: `networking`, `security`, and
`compute`. The modules are deliberately small baselines, not a complete production
platform. Databases, load balancers, DNS, certificates, monitoring, backups, and
secret delivery must be designed and reviewed before a production rollout.

## Environment overlays

`environments/dev`, `environments/staging`, and `environments/production` contain
reviewable `terraform.tfvars` values and a backend configuration for each provider.
They are separate state roots; values do not inherit or merge. Run a root by passing
both files explicitly:

```bash
cd infra/terraform/aws
terraform init -backend-config=environments/dev/backend.hcl
terraform plan -var-file=environments/dev/terraform.tfvars
terraform apply -var-file=environments/dev/terraform.tfvars
```

Replace `aws` and `dev` as required. Copy the example backend values into an
organization-owned backend before `init`; never commit backend credentials or cloud
API tokens. Changing environments in an initialized working directory requires
`terraform init -reconfigure` (or, preferably, a fresh CI workspace).

Production inputs intentionally require an operator-supplied SSH public key and
trusted administrator CIDRs. Commit only non-secret configuration. Supply keys,
credentials, and sensitive variables through the CI secret store using `TF_VAR_*`
or provider-native environment variables.

## State strategy

Every provider uses Terraform's `http` backend declaration so state can be held by a
single approved, encrypted, versioned, access-controlled state service (for example,
GitLab-managed state, Terraform Cloud's compatible state API, or an internal state
service). Each `backend.hcl` assigns a unique provider/environment address. The
service must provide locking, TLS, encryption at rest, audit logs, least-privilege
CI identities, version retention, and tested recovery. Configure `username` and
`password` only via `TF_HTTP_USERNAME` and `TF_HTTP_PASSWORD`.

State is never shared across environments or providers. Production state writes
require an approval gate; plans are generated in CI and applied from the reviewed
plan artifact. See [ADR 0001](../../docs/adr/0001-terraform-layout-and-state.md).

## Validation

```bash
terraform fmt -check -recursive infra/terraform
for provider in aws azure upcloud; do
  terraform -chdir="infra/terraform/${provider}" init -backend=false
  terraform -chdir="infra/terraform/${provider}" validate
 done
```
