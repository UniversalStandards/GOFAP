# One-Click Deployment Workflow

This document describes how to use the GitHub Actions workflow for deploying GOFAP to various platforms.

## Overview

The `deploy-selected-platform.yml` workflow provides a secure, one-click deployment mechanism that supports:
- **UpCloud** servers
- **AWS EC2** instances
- **Azure VMs**

The workflow uses SSH to connect to your deployment target and execute deployment commands.

## Security Features

### SSH Host Key Verification

To prevent man-in-the-middle (MITM) attacks, the workflow requires SSH host key fingerprints for all deployment targets. This ensures that the GitHub Actions runner only connects to the legitimate server.

## Required Secrets

You must configure the following secrets in your GitHub repository settings (`Settings` → `Secrets and variables` → `Actions`).

### For UpCloud Deployments

| Secret Name | Description |
|------------|-------------|
| `UPCLOUD_DEPLOY_HOST` | The hostname or IP address of your UpCloud server |
| `UPCLOUD_DEPLOY_USER` | SSH username (e.g., `root` or `ubuntu`) |
| `UPCLOUD_SSH_PRIVATE_KEY` | SSH private key for authentication |
| `UPCLOUD_SSH_HOST_FINGERPRINT` | SHA256 fingerprint of the server's SSH host key |

### For AWS EC2 Deployments

| Secret Name | Description |
|------------|-------------|
| `AWS_EC2_DEPLOY_HOST` | The hostname or IP address of your EC2 instance |
| `AWS_EC2_DEPLOY_USER` | SSH username (typically `ec2-user` or `ubuntu`) |
| `AWS_EC2_SSH_PRIVATE_KEY` | SSH private key for authentication |
| `AWS_EC2_SSH_HOST_FINGERPRINT` | SHA256 fingerprint of the server's SSH host key |

### For Azure VM Deployments

| Secret Name | Description |
|------------|-------------|
| `AZURE_VM_DEPLOY_HOST` | The hostname or IP address of your Azure VM |
| `AZURE_VM_DEPLOY_USER` | SSH username (e.g., `azureuser`) |
| `AZURE_VM_SSH_PRIVATE_KEY` | SSH private key for authentication |
| `AZURE_VM_SSH_HOST_FINGERPRINT` | SHA256 fingerprint of the server's SSH host key |

## How to Obtain SSH Host Fingerprints

The SSH host fingerprint is a SHA256 hash that uniquely identifies your server. You can obtain it in one of two ways:

### Method 1: From the Server (Recommended)

If you have SSH access to your deployment server, run this command:

```bash
ssh-keygen -l -f /etc/ssh/ssh_host_ed25519_key.pub | cut -d ' ' -f2
```

This will output a fingerprint like:
```
SHA256:aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcdefg
```

### Method 2: From Your Local Machine

If you can connect to the server from your local machine, use `ssh-keyscan`:

```bash
ssh-keyscan -t ed25519 your-server-hostname.com | ssh-keygen -lf -
```

**Note:** The fingerprint should start with `SHA256:` and contain the hash value.

## Setting Up SSH Keys

1. **Generate an SSH key pair** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy"
   ```

2. **Copy the public key to your server**:
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server
   ```

3. **Copy the private key** to add as a GitHub secret:
   ```bash
   cat ~/.ssh/id_ed25519
   ```
   Copy the entire output, including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

## Using the Workflow

1. Go to your repository on GitHub
2. Click on `Actions` tab
3. Select `Deploy (Selected Platform)` workflow from the left sidebar
4. Click `Run workflow` button
5. Configure the deployment:
   - **Platform**: Choose your target platform (upcloud, aws-ec2, or azure-vm)
   - **Deployment environment**: Choose dev, staging, or production
   - **Git ref**: Select the branch to deploy (default: main)
   - **Dry run**: Set to `false` to perform actual deployment, or `true` to validate configuration only

## Deployment Process

When the workflow runs, it will:

1. ✅ Validate that all required secrets are configured
2. ✅ Verify the SSH host fingerprint to prevent MITM attacks
3. ✅ Connect to the target server via SSH
4. ✅ Navigate to the deployment directory (`/opt/gofap` by default)
5. ✅ Fetch the latest code from Git
6. ✅ Checkout the specified Git ref
7. ✅ Pull Docker images
8. ✅ Rebuild and restart containers with Docker Compose
9. ✅ Clean up unused Docker images

## Server Prerequisites

Your deployment server must have:
- Git installed and configured
- Docker and Docker Compose installed
- The GOFAP repository cloned to `/opt/gofap` (or set `DEPLOY_DIR` environment variable)
- SSH access configured with the provided keys

## Troubleshooting

### "Missing secret" Error

If you see an error like `Missing secret: UPCLOUD_SSH_HOST_FINGERPRINT`, ensure you've added all required secrets for your chosen platform in GitHub repository settings.

### SSH Connection Failed

If the SSH connection fails:
1. Verify the hostname/IP is correct
2. Ensure the SSH private key matches the public key on the server
3. Check that the host fingerprint is correct
4. Verify firewall rules allow SSH from GitHub Actions IPs

### Host Key Verification Failed

If you see a host key verification error:
1. Re-obtain the SSH host fingerprint using the methods above
2. Update the `*_SSH_HOST_FINGERPRINT` secret in GitHub
3. Ensure you're copying the complete fingerprint including `SHA256:`

## Security Best Practices

1. ✅ **Always use SSH key authentication** - Never use password authentication
2. ✅ **Verify host fingerprints** - Always configure host fingerprints to prevent MITM attacks
3. ✅ **Use separate keys per platform** - Don't reuse the same SSH key across different platforms
4. ✅ **Rotate keys regularly** - Update SSH keys periodically
5. ✅ **Limit key permissions** - Use dedicated deployment users with minimal required permissions
6. ✅ **Use environment protection rules** - Configure GitHub environment protection rules for production deployments
7. ✅ **Enable dry run first** - Always test with dry run before actual deployment

## Related Documentation

- [DEPLOYMENT_README.md](./DEPLOYMENT_README.md) - General deployment guide
- [EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md) - Detailed AWS EC2 setup
- [DEPLOYMENT_UPCLOUD.md](./DEPLOYMENT_UPCLOUD.md) - UpCloud-specific instructions
