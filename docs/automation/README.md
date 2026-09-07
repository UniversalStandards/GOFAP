# Repository automation

Only executable GitHub Actions workflows belong in `.github/workflows/`. Supporting
configuration samples and historical reference material belong in
[`examples/`](examples/), where GitHub Actions will not interpret them as workflows.

## Active workflows

| Workflow | Purpose | Owner |
| --- | --- | --- |
| [`ci.yml`](../../.github/workflows/ci.yml) | Runs type checking, tests, linting, and build artifact validation for pull requests and protected branch pushes. | `@gofaps-admins` |
| [`Automated Maintenance.yml`](../../.github/workflows/Automated%20Maintenance.yml) | Performs scheduled cache, artifact, and repository maintenance. | `@gofaps-admins` |
| [`Automated dependency management and security scanning workflow.yml`](../../.github/workflows/Automated%20dependency%20management%20and%20security%20scanning%20workflow.yml) | Audits dependencies and performs scheduled security maintenance. | `@gofaps-admins` |
| [`container-image.yml`](../../.github/workflows/container-image.yml) | Builds and publishes the application container image. | `@gofaps-release-managers` |
| [`promote-image.yml`](../../.github/workflows/promote-image.yml) | Promotes a tested container image to staging or production tags. | `@gofaps-release-managers` |
| [`deploy-azure.yml`](../../.github/workflows/deploy-azure.yml) | Deploys the application to Azure App Service. | `@gofaps-release-managers` |
| [`deploy-free-tier.yml`](../../.github/workflows/deploy-free-tier.yml) | Deploys the Render backend and Vercel frontend and checks their health. | `@gofaps-release-managers` |
| [`deploy-selected-platform.yml`](../../.github/workflows/deploy-selected-platform.yml) | Manually deploys a selected Git ref to UpCloud, AWS EC2, or Azure VM. | `@gofaps-release-managers` |
| [`environment-gates.yml`](../../.github/workflows/environment-gates.yml) | Enforces ordered dev, staging, and production environment approvals. | `@gofaps-release-managers` |
| [`cloudflare-purge-cache.yml`](../../.github/workflows/cloudflare-purge-cache.yml) | Purges Cloudflare caches after an authorized deployment. | `@gofaps-release-managers` |

Ownership follows [`.github/CODEOWNERS`](../../.github/CODEOWNERS). Update this inventory
whenever an active workflow is added, renamed, removed, or transferred to another team.

## Examples

Files under [`examples/`](examples/) are documentation only. They are not production
configuration and are not loaded by GitHub Actions. Copy and review an example before
adapting it to an active automation surface.
