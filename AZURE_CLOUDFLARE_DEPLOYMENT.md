# GOFAPS Azure Deployment with Cloudflare CDN and GitHub Actions

Complete guide for deploying GOFAPS to Azure with Cloudflare CDN and automated GitHub Actions CI/CD.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Part 1: Azure Infrastructure Setup](#part-1-azure-infrastructure-setup)
- [Part 2: GitHub Actions Configuration](#part-2-github-actions-configuration)
- [Part 3: Cloudflare CDN Setup](#part-3-cloudflare-cdn-setup)
- [Part 4: Deployment Workflow](#part-4-deployment-workflow)
- [Part 5: Monitoring and Operations](#part-5-monitoring-and-operations)
- [Part 6: Troubleshooting](#part-6-troubleshooting)

---

## Prerequisites

### Required Accounts
- **Azure Account** with active subscription
- **Cloudflare Account** with domain access
- **GitHub Account** with repository admin access
- **Domain Name** registered and pointing to Cloudflare nameservers

### Required Tools
- Azure CLI (`az`) version 2.50+
- Terraform 1.3+ (optional, for infrastructure as code)
- Docker Desktop (for local testing)
- Node.js 20+ (for local development)

---

## Architecture Overview

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │
       ├─ Push to main
       │
┌──────▼────────────┐
│ GitHub Actions    │
│ - Build Docker    │
│ - Run Tests       │
│ - Security Scan   │
│ - Push to ACR     │
└──────┬────────────┘
       │
       ├─ Deploy
       │
┌──────▼────────────────────────┐
│  Azure Container Registry     │
│  - Dev images                 │
│  - Staging images             │
│  - Production images          │
└──────┬────────────────────────┘
       │
       ├─ Pull image
       │
┌──────▼────────────────────────┐
│  Azure Container Instances    │
│  or Azure App Service         │
│  - GOFAPS Application         │
│  - Port 5000                  │
└──────┬────────────────────────┘
       │
       ├─ Backend traffic
       │
┌──────▼────────────────────────┐
│  Azure Database PostgreSQL    │
│  - Flexible Server            │
│  - Private endpoint           │
└───────────────────────────────┘

           │
           ├─ Public traffic
           │
┌──────────▼────────────────────┐
│     Cloudflare CDN            │
│  - SSL/TLS termination        │
│  - DDoS protection            │
│  - WAF rules                  │
│  - Caching & optimization     │
└──────┬────────────────────────┘
       │
       └─ Users/Browsers
```

---

## Part 1: Azure Infrastructure Setup

### Step 1: Create Azure Resources

#### 1.1 Create Resource Groups

```bash
# Login to Azure
az login

# Set subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Create resource groups for different environments
az group create \
  --name gofap-dev-rg \
  --location eastus \
  --tags Environment=development Project=GOFAP

az group create \
  --name gofap-staging-rg \
  --location eastus \
  --tags Environment=staging Project=GOFAP

az group create \
  --name gofap-prod-rg \
  --location eastus \
  --tags Environment=production Project=GOFAP
```

#### 1.2 Create Azure Container Registry (ACR)

```bash
# Create ACR for container images
az acr create \
  --name gofapacr \
  --resource-group gofap-prod-rg \
  --sku Standard \
  --location eastus \
  --admin-enabled false

# Enable vulnerability scanning (Azure Defender)
az security pricing create \
  --name ContainerRegistry \
  --tier standard
```

#### 1.3 Create Azure Database for PostgreSQL

```bash
# Create PostgreSQL Flexible Server for production
az postgres flexible-server create \
  --name gofap-prod-db \
  --resource-group gofap-prod-rg \
  --location eastus \
  --admin-user gofapadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose \
  --version 15 \
  --storage-size 128 \
  --backup-retention 30 \
  --high-availability Enabled

# Create database
az postgres flexible-server db create \
  --resource-group gofap-prod-rg \
  --server-name gofap-prod-db \
  --database-name gofaps

# Configure firewall (allow Azure services)
az postgres flexible-server firewall-rule create \
  --resource-group gofap-prod-rg \
  --name gofap-prod-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

#### 1.4 Create Azure App Service (Alternative to Container Instances)

**Option A: Container Instances (Simpler)**

```bash
# Create container instance
az container create \
  --resource-group gofap-prod-rg \
  --name gofap-prod-app \
  --image gofapacr.azurecr.io/gofap-app:prod-latest \
  --dns-name-label gofap-prod \
  --ports 5000 \
  --cpu 2 \
  --memory 4 \
  --environment-variables \
    NODE_ENV=production \
    PORT=5000 \
  --secure-environment-variables \
    DATABASE_URL='postgresql://...' \
    SESSION_SECRET='your-session-secret'
```

**Option B: App Service (More features, recommended)**

```bash
# Create App Service Plan
az appservice plan create \
  --name gofap-prod-plan \
  --resource-group gofap-prod-rg \
  --is-linux \
  --sku P1V3 \
  --number-of-workers 2

# Create Web App
az webapp create \
  --name gofap-prod-app \
  --resource-group gofap-prod-rg \
  --plan gofap-prod-plan \
  --deployment-container-image-name gofapacr.azurecr.io/gofap-app:prod-latest

# Configure environment variables
az webapp config appsettings set \
  --resource-group gofap-prod-rg \
  --name gofap-prod-app \
  --settings \
    NODE_ENV=production \
    PORT=5000 \
    WEBSITES_PORT=5000 \
    DATABASE_URL='@Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/database-url/)' \
    SESSION_SECRET='@Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/session-secret/)'

# Enable managed identity for ACR pull
az webapp identity assign \
  --resource-group gofap-prod-rg \
  --name gofap-prod-app

# Grant ACR pull permission
PRINCIPAL_ID=$(az webapp identity show --resource-group gofap-prod-rg --name gofap-prod-app --query principalId --output tsv)
ACR_ID=$(az acr show --name gofapacr --resource-group gofap-prod-rg --query id --output tsv)

az role assignment create \
  --assignee $PRINCIPAL_ID \
  --scope $ACR_ID \
  --role AcrPull
```

#### 1.5 Create Azure Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name gofap-prod-kv \
  --resource-group gofap-prod-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name gofap-prod-kv \
  --name database-url \
  --value "postgresql://gofapadmin:YourSecurePassword123!@gofap-prod-db.postgres.database.azure.com:5432/gofaps"

az keyvault secret set \
  --vault-name gofap-prod-kv \
  --name session-secret \
  --value "$(openssl rand -base64 32)"

az keyvault secret set \
  --vault-name gofap-prod-kv \
  --name stripe-secret-key \
  --value "sk_live_YOUR_STRIPE_KEY"

# Grant App Service access to Key Vault
az keyvault set-policy \
  --name gofap-prod-kv \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

#### 1.6 (Optional) Use Terraform

```bash
# Navigate to terraform directory
cd infra/terraform/azure

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
subscription_ids = {
  dev            = "YOUR_DEV_SUBSCRIPTION_ID"
  staging        = "YOUR_STAGING_SUBSCRIPTION_ID"
  prod           = "YOUR_PROD_SUBSCRIPTION_ID"
  shared_network = "YOUR_SHARED_SUBSCRIPTION_ID"
}

resource_group_names = {
  dev            = "gofap-dev-rg"
  staging        = "gofap-staging-rg"
  prod           = "gofap-prod-rg"
  shared_network = "gofap-shared-rg"
}

location = "eastus"

tags = {
  Project     = "GOFAP"
  ManagedBy   = "Terraform"
  Environment = "Production"
}
EOF

# Plan and apply
terraform plan
terraform apply
```

---

## Part 2: GitHub Actions Configuration

### Step 1: Configure Azure OIDC Authentication

#### 2.1 Create Azure AD App Registration

```bash
# Create app registration
APP_ID=$(az ad app create \
  --display-name "GOFAP-GitHub-Actions" \
  --query appId \
  --output tsv)

# Create service principal
SP_ID=$(az ad sp create \
  --id $APP_ID \
  --query id \
  --output tsv)

# Get tenant ID
TENANT_ID=$(az account show --query tenantId --output tsv)

# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id --output tsv)

echo "App ID: $APP_ID"
echo "Tenant ID: $TENANT_ID"
echo "Subscription ID: $SUBSCRIPTION_ID"
```

#### 2.2 Create Federated Credentials

```bash
# For main branch
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "GOFAP-Main-Branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:UniversalStandards/GOFAP:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# For pull requests
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "GOFAP-Pull-Requests",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:UniversalStandards/GOFAP:pull_request",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# For environment-specific deployments
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "GOFAP-Production",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:UniversalStandards/GOFAP:environment:production",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

#### 2.3 Assign Azure Permissions

```bash
# Assign contributor role to resource groups
az role assignment create \
  --assignee $SP_ID \
  --role Contributor \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/gofap-prod-rg

# Assign ACR push permission
ACR_ID=$(az acr show --name gofapacr --query id --output tsv)
az role assignment create \
  --assignee $SP_ID \
  --role AcrPush \
  --scope $ACR_ID
```

### Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
Required Secrets:
├── AZURE_CLIENT_ID           (from $APP_ID above)
├── AZURE_TENANT_ID           (from $TENANT_ID above)
├── AZURE_SUBSCRIPTION_ID     (from $SUBSCRIPTION_ID above)
├── ACR_NAME                  (gofapacr)
└── CLOUDFLARE_API_TOKEN      (from Cloudflare dashboard)

Optional Secrets (for complete setup):
├── DATABASE_URL              (PostgreSQL connection string)
├── SESSION_SECRET            (Generate with openssl rand -base64 32)
├── STRIPE_SECRET_KEY         (if using Stripe)
└── SMTP_PASSWORD             (if using email notifications)
```

**Add secrets via GitHub CLI:**

```bash
# Install GitHub CLI
# https://cli.github.com/

# Login
gh auth login

# Set secrets
gh secret set AZURE_CLIENT_ID --body "$APP_ID"
gh secret set AZURE_TENANT_ID --body "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID --body "$SUBSCRIPTION_ID"
gh secret set ACR_NAME --body "gofapacr"
```

### Step 3: Verify Existing Workflows

The repository already has these workflows configured:

1. **`.github/workflows/container-image.yml`** - Builds and pushes to ACR ✅
2. **`.github/workflows/promote-image.yml`** - Promotes images between environments ✅
3. **`.github/workflows/ci.yml`** - Runs tests and checks ✅

No changes needed to these files!

### Step 4: Add Azure App Service Deployment Workflow

Create `.github/workflows/deploy-azure.yml`:

```yaml
name: Deploy to Azure App Service

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - dev
          - staging
          - production
      image_tag:
        description: 'Image tag to deploy'
        required: true
        default: 'latest'

permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
    steps:
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Set environment variables
        run: |
          case "${{ github.event.inputs.environment }}" in
            dev)
              echo "RESOURCE_GROUP=gofap-dev-rg" >> $GITHUB_ENV
              echo "APP_NAME=gofap-dev-app" >> $GITHUB_ENV
              ;;
            staging)
              echo "RESOURCE_GROUP=gofap-staging-rg" >> $GITHUB_ENV
              echo "APP_NAME=gofap-staging-app" >> $GITHUB_ENV
              ;;
            production)
              echo "RESOURCE_GROUP=gofap-prod-rg" >> $GITHUB_ENV
              echo "APP_NAME=gofap-prod-app" >> $GITHUB_ENV
              ;;
          esac
      
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.APP_NAME }}
          images: ${{ secrets.ACR_NAME }}.azurecr.io/gofap-app:${{ github.event.inputs.environment }}-${{ github.event.inputs.image_tag }}
      
      - name: Health check
        run: |
          echo "Waiting for deployment..."
          sleep 30
          curl -f https://${{ env.APP_NAME }}.azurewebsites.net/health || exit 1
      
      - name: Azure logout
        run: az logout
```

---

## Part 3: Cloudflare CDN Setup

### Step 1: Add Domain to Cloudflare

1. **Login to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Add Site**: Click "Add a Site" → Enter your domain → Select Free plan
3. **Update Nameservers**: Point your domain to Cloudflare nameservers (provided after adding site)

### Step 2: Configure DNS Records

Add DNS records pointing to Azure:

```
Type: A
Name: @
Content: <Azure App Service IP> or use CNAME
Proxy: Enabled (orange cloud)

Type: CNAME
Name: www
Content: gofap-prod-app.azurewebsites.net
Proxy: Enabled (orange cloud)

Type: CNAME
Name: api
Content: gofap-prod-app.azurewebsites.net
Proxy: Enabled (orange cloud)
```

**Get Azure App Service IP:**

```bash
az webapp show \
  --name gofap-prod-app \
  --resource-group gofap-prod-rg \
  --query defaultHostName \
  --output tsv
```

### Step 3: Configure SSL/TLS

1. **SSL/TLS Settings**: 
   - Go to SSL/TLS → Overview
   - Set encryption mode to **"Full (strict)"**
   
2. **Edge Certificates**:
   - Enable **"Always Use HTTPS"**
   - Enable **"Automatic HTTPS Rewrites"**
   - Set **Minimum TLS Version** to 1.2

3. **Origin Server Certificate** (Optional but recommended):
   ```bash
   # Generate origin certificate in Cloudflare
   # SSL/TLS → Origin Server → Create Certificate
   # Download certificate and key
   
   # Upload to Azure Key Vault
   az keyvault certificate import \
     --vault-name gofap-prod-kv \
     --name cloudflare-origin-cert \
     --file origin-cert.pem
   ```

### Step 4: Configure Caching Rules

1. **Page Rules** (Free plan: 3 rules):
   ```
   Rule 1: Cache API responses
   URL: *yourdomain.com/api/*
   Settings:
   - Cache Level: Standard
   - Edge Cache TTL: 2 hours
   
   Rule 2: Bypass cache for authenticated routes
   URL: *yourdomain.com/api/auth/*
   Settings:
   - Cache Level: Bypass
   
   Rule 3: Cache static assets
   URL: *yourdomain.com/assets/*
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   ```

### Step 5: Configure Security Settings

1. **Firewall Rules**:
   ```
   - Block countries (if applicable)
   - Rate limiting: 100 requests per minute per IP
   - Challenge on threat score > 10
   ```

2. **WAF (Web Application Firewall)**:
   - Enable OWASP Core Ruleset
   - Enable Cloudflare Managed Rulesets

3. **DDoS Protection**:
   - Automatically enabled with proxy (orange cloud)

4. **Bot Management**:
   - Enable "Bot Fight Mode" (free)
   - Or use "Super Bot Fight Mode" (paid)

### Step 6: Configure Performance Settings

1. **Speed → Optimization**:
   - Enable Auto Minify (HTML, CSS, JS)
   - Enable Brotli compression
   - Enable Early Hints
   - Enable HTTP/3 (QUIC)

2. **Caching → Configuration**:
   - Browser Cache TTL: 4 hours
   - Enable Always Online™

### Step 7: Configure Cloudflare API Integration

Create `.github/workflows/cloudflare-purge-cache.yml`:

```yaml
name: Purge Cloudflare Cache

on:
  workflow_dispatch:
  push:
    branches:
      - main
    paths:
      - 'client/**'
      - 'public/**'

jobs:
  purge-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Purge Cloudflare cache
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'
```

**Get Zone ID:**
```bash
# From Cloudflare Dashboard → Your Domain → Overview (right sidebar)
# Or via API:
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

Add to GitHub secrets:
```bash
gh secret set CLOUDFLARE_ZONE_ID --body "YOUR_ZONE_ID"
gh secret set CLOUDFLARE_API_TOKEN --body "YOUR_API_TOKEN"
```

---

## Part 4: Deployment Workflow

### Complete Deployment Process

```bash
# 1. Local development and testing
npm run dev
npm run test
npm run lint

# 2. Commit and push to feature branch
git checkout -b feature/my-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature

# 3. Create pull request (triggers CI checks)
gh pr create --title "Add new feature" --body "Description"

# 4. Merge to main (triggers dev build and deployment)
gh pr merge --auto --squash

# 5. Automatic dev deployment
# GitHub Actions builds and pushes dev-<sha> and dev-latest to ACR

# 6. Test in dev environment
curl https://dev.yourdomain.com/health

# 7. Promote to staging (manual)
gh workflow run promote-image.yml \
  --field source_tag=dev-abc1234 \
  --field target_environment=staging

# 8. Deploy to staging
gh workflow run deploy-azure.yml \
  --field environment=staging \
  --field image_tag=abc1234

# 9. Test in staging
curl https://staging.yourdomain.com/health

# 10. Promote to production (manual with approval)
gh workflow run promote-image.yml \
  --field source_tag=staging-abc1234 \
  --field target_environment=production

# 11. Deploy to production (requires approval)
gh workflow run deploy-azure.yml \
  --field environment=production \
  --field image_tag=abc1234

# 12. Verify production deployment
curl https://yourdomain.com/health

# 13. Purge Cloudflare cache
gh workflow run cloudflare-purge-cache.yml
```

### Rollback Procedure

```bash
# Find previous working image
az acr repository show-tags \
  --name gofapacr \
  --repository gofap-app \
  --orderby time_desc \
  --output table

# Deploy previous version
gh workflow run deploy-azure.yml \
  --field environment=production \
  --field image_tag=PREVIOUS_TAG
```

---

## Part 5: Monitoring and Operations

### Azure Monitor Setup

```bash
# Enable Application Insights
az monitor app-insights component create \
  --app gofap-prod-insights \
  --location eastus \
  --resource-group gofap-prod-rg \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app gofap-prod-insights \
  --resource-group gofap-prod-rg \
  --query instrumentationKey \
  --output tsv)

# Add to App Service
az webapp config appsettings set \
  --resource-group gofap-prod-rg \
  --name gofap-prod-app \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

### Configure Alerts

```bash
# CPU alert
az monitor metrics alert create \
  --name "High CPU Usage" \
  --resource-group gofap-prod-rg \
  --scopes $(az webapp show --name gofap-prod-app --resource-group gofap-prod-rg --query id --output tsv) \
  --condition "avg Percentage CPU > 80" \
  --description "Alert when CPU exceeds 80%"

# Memory alert
az monitor metrics alert create \
  --name "High Memory Usage" \
  --resource-group gofap-prod-rg \
  --scopes $(az webapp show --name gofap-prod-app --resource-group gofap-prod-rg --query id --output tsv) \
  --condition "avg Memory Working Set > 1.5GB" \
  --description "Alert when memory exceeds 1.5GB"
```

### Cloudflare Analytics

1. **Analytics → Traffic**: Monitor requests, bandwidth, threats
2. **Analytics → Performance**: Track load times, origins
3. **Analytics → Security**: Review threats blocked

### Health Monitoring Script

Create `scripts/health-check.sh`:

```bash
#!/bin/bash

ENDPOINTS=(
  "https://yourdomain.com/health"
  "https://staging.yourdomain.com/health"
  "https://dev.yourdomain.com/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Checking $endpoint..."
  response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
  
  if [ "$response" = "200" ]; then
    echo "✅ $endpoint is healthy"
  else
    echo "❌ $endpoint returned $response"
    # Send alert (e.g., via Slack, email, etc.)
  fi
done
```

---

## Part 6: Troubleshooting

### Common Issues

#### Issue 1: Build Fails in GitHub Actions

**Symptoms**: Container image build fails
**Solutions**:
```bash
# Check build logs
gh run list --workflow=container-image.yml
gh run view RUN_ID --log

# Test build locally
docker build -t gofap-test .
```

#### Issue 2: App Service Won't Start

**Symptoms**: App Service shows "Application Error"
**Solutions**:
```bash
# Check application logs
az webapp log tail --name gofap-prod-app --resource-group gofap-prod-rg

# Check environment variables
az webapp config appsettings list \
  --name gofap-prod-app \
  --resource-group gofap-prod-rg

# Restart app
az webapp restart --name gofap-prod-app --resource-group gofap-prod-rg
```

#### Issue 3: Database Connection Errors

**Symptoms**: "Connection refused" or timeout errors
**Solutions**:
```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group gofap-prod-rg \
  --name gofap-prod-db

# Test connection
psql "postgresql://gofapadmin:PASSWORD@gofap-prod-db.postgres.database.azure.com/gofaps?sslmode=require"
```

#### Issue 4: Cloudflare 521 Error

**Symptoms**: "Web server is down" error
**Solutions**:
1. Check Azure App Service is running
2. Verify origin server certificate
3. Check Cloudflare SSL/TLS mode (should be Full or Full Strict)
4. Verify DNS records point to correct Azure endpoint

#### Issue 5: Slow Response Times

**Symptoms**: High latency, slow page loads
**Solutions**:
1. Check Cloudflare caching rules
2. Enable compression in Azure App Service
3. Scale up App Service Plan
4. Add Redis cache for session storage
5. Review database query performance

### Support Resources

- **Azure Support**: https://portal.azure.com → Support
- **Cloudflare Support**: https://support.cloudflare.com
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **GOFAP Issues**: https://github.com/UniversalStandards/GOFAP/issues

---

## Quick Reference Commands

```bash
# Azure
az login
az account set --subscription ID
az webapp restart --name APP --resource-group RG
az webapp log tail --name APP --resource-group RG

# Docker
docker build -t gofap:test .
docker run -p 5000:5000 gofap:test

# GitHub CLI
gh workflow list
gh workflow run WORKFLOW_NAME
gh run list --workflow=WORKFLOW_NAME
gh run view RUN_ID --log

# Cloudflare CLI (wrangler)
npm install -g wrangler
wrangler login
wrangler pages deployment list

# Health checks
curl https://yourdomain.com/health
curl https://yourdomain.com/health/ready
```

---

## Security Checklist

- [ ] Azure OIDC federated credentials configured
- [ ] Secrets stored in Azure Key Vault
- [ ] Managed identities used for ACR access
- [ ] Database in private subnet with firewall rules
- [ ] Cloudflare SSL/TLS set to Full (Strict)
- [ ] WAF rules enabled in Cloudflare
- [ ] DDoS protection active
- [ ] Rate limiting configured
- [ ] Application Insights monitoring enabled
- [ ] Alerts configured for critical metrics
- [ ] Backups automated for database
- [ ] Log retention policy configured

---

**Last Updated**: January 9, 2026  
**Status**: Production Ready  
**Next Review**: February 9, 2026
