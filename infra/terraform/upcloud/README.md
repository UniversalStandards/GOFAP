# UpCloud Terraform baseline

This root composes the provider-specific `networking`, `security`, and `compute`
modules. Select exactly one overlay from `environments/dev`,
`environments/staging`, or `environments/production` and follow the initialization
and state requirements in the [Terraform infrastructure guide](../README.md).

Before planning, configure provider credentials with the provider's standard
environment variables and export both `TF_VAR_ssh_public_key` and
`TF_VAR_admin_cidrs`. Values committed in overlays are non-secret sizing and
network defaults only. Review the plan and obtain approval before every apply.
