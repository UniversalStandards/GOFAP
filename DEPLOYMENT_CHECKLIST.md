# Azure + Cloudflare + GitHub Deployment Checklist

Complete checklist for deploying GOFAPS to Azure with Cloudflare CDN and GitHub Actions automation.

## Pre-Deployment Checklist

### 1. Azure Account Setup
- [ ] Azure subscription active and accessible
- [ ] Azure CLI installed and logged in (`az login`)
- [ ] Appropriate permissions (Contributor or Owner role)
- [ ] Billing alerts configured
- [ ] Resource naming convention decided

### 2. GitHub Repository Setup
- [ ] GitHub repository access (admin permissions)
- [ ] GitHub CLI installed (`gh`) (optional)
- [ ] Branch protection rules configured
- [ ] Code review requirements set

### 3. Cloudflare Account Setup
- [ ] Cloudflare account created
- [ ] Domain registered and accessible
- [ ] Domain nameservers updated to Cloudflare
- [ ] DNS propagation complete (24-48 hours)

### 4. Development Environment
- [ ] Node.js 20+ installed
- [ ] Docker Desktop installed
- [ ] Git configured with SSH keys
- [ ] Local `.env` file configured
- [ ] Application runs locally (`npm run dev`)
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)

---

## Azure Infrastructure Deployment

### Phase 1: Resource Groups (15 minutes)
- [ ] Development resource group created (`gofap-dev-rg`)
- [ ] Staging resource group created (`gofap-staging-rg`)
- [ ] Production resource group created (`gofap-prod-rg`)
- [ ] Shared resource group created (`gofap-shared-rg`)
- [ ] Tags applied to all resource groups

### Phase 2: Azure Container Registry (20 minutes)
- [ ] ACR created (`gofapacr`)
- [ ] Admin access disabled (using managed identities)
- [ ] Vulnerability scanning enabled (Azure Defender)
- [ ] Geo-replication configured (optional, for production)
- [ ] Access tested (`az acr login --name gofapacr`)

### Phase 3: Database Setup (30 minutes)
- [ ] PostgreSQL Flexible Server created for each environment
- [ ] High availability enabled (production only)
- [ ] Backup retention configured (30 days for production)
- [ ] Firewall rules configured
- [ ] Database created (`gofaps`)
- [ ] Connection tested from local machine
- [ ] Admin credentials stored in Key Vault
- [ ] SSL/TLS enforced

### Phase 4: Azure Key Vault (15 minutes)
- [ ] Key Vault created (`gofap-prod-kv`)
- [ ] Soft delete enabled
- [ ] Purge protection enabled (production)
- [ ] Access policies configured
- [ ] Secrets stored:
  - [ ] `database-url`
  - [ ] `session-secret`
  - [ ] `stripe-secret-key` (if applicable)
  - [ ] `smtp-password` (if applicable)
- [ ] Secrets tested and verified

### Phase 5: App Service or Container Instances (30 minutes)

**Option A: App Service (Recommended)**
- [ ] App Service Plan created (Linux, P1V3 or higher)
- [ ] Auto-scaling configured (optional)
- [ ] Web App created for each environment
- [ ] Managed identity enabled
- [ ] ACR pull permissions granted
- [ ] Application settings configured
- [ ] Key Vault references working
- [ ] HTTPS only enforced
- [ ] Health check endpoint configured

**Option B: Container Instances**
- [ ] Container instances created for each environment
- [ ] CPU and memory allocated appropriately
- [ ] Environment variables configured
- [ ] Secure environment variables for secrets
- [ ] DNS labels configured
- [ ] Container tested and running

### Phase 6: Networking (Optional but Recommended)
- [ ] Virtual Network created
- [ ] Subnets configured
- [ ] Network Security Groups created
- [ ] Private endpoints configured for database
- [ ] VNet integration enabled for App Service
- [ ] Service endpoints configured

### Phase 7: Monitoring (20 minutes)
- [ ] Application Insights created
- [ ] Instrumentation key configured
- [ ] Log Analytics workspace created
- [ ] Alerts configured:
  - [ ] High CPU usage (>80%)
  - [ ] High memory usage (>1.5GB)
  - [ ] Failed requests (>5%)
  - [ ] Response time degradation
  - [ ] Database connection failures
- [ ] Action groups created for notifications
- [ ] Email/SMS alerts configured

---

## GitHub Actions Configuration

### Phase 1: Azure OIDC Setup (25 minutes)
- [ ] Azure AD App Registration created
- [ ] Service Principal created
- [ ] Federated credentials configured:
  - [ ] Main branch credential
  - [ ] Pull request credential
  - [ ] Production environment credential
  - [ ] Staging environment credential
  - [ ] Dev environment credential
- [ ] Azure role assignments created:
  - [ ] Contributor role for resource groups
  - [ ] AcrPush role for container registry
- [ ] Credentials tested

### Phase 2: GitHub Secrets (10 minutes)
- [ ] `AZURE_CLIENT_ID` added
- [ ] `AZURE_TENANT_ID` added
- [ ] `AZURE_SUBSCRIPTION_ID` added
- [ ] `ACR_NAME` added
- [ ] `CLOUDFLARE_API_TOKEN` added
- [ ] `CLOUDFLARE_ZONE_ID` added
- [ ] Environment-specific secrets added (optional)
- [ ] Secrets tested in workflow

### Phase 3: GitHub Environments (15 minutes)
- [ ] Development environment created
- [ ] Staging environment created
- [ ] Production environment created
- [ ] Required reviewers configured (production)
- [ ] Wait timer configured (production, optional)
- [ ] Environment secrets configured
- [ ] Deployment branches configured

### Phase 4: Workflows Verification (20 minutes)
- [ ] `container-image.yml` workflow runs successfully
- [ ] `promote-image.yml` workflow runs successfully
- [ ] `deploy-azure.yml` workflow created and tested
- [ ] `cloudflare-purge-cache.yml` workflow created and tested
- [ ] `ci.yml` workflow runs successfully
- [ ] All workflows have appropriate permissions
- [ ] Workflow logs reviewed for errors

---

## Cloudflare Configuration

### Phase 1: DNS Setup (15 minutes)
- [ ] Domain added to Cloudflare
- [ ] Nameservers updated at registrar
- [ ] DNS propagation verified
- [ ] A/CNAME records created for:
  - [ ] Root domain (@)
  - [ ] www subdomain
  - [ ] api subdomain (optional)
  - [ ] dev subdomain
  - [ ] staging subdomain
- [ ] DNS records proxied (orange cloud enabled)
- [ ] DNS records tested

### Phase 2: SSL/TLS Configuration (10 minutes)
- [ ] SSL/TLS mode set to "Full (Strict)"
- [ ] "Always Use HTTPS" enabled
- [ ] "Automatic HTTPS Rewrites" enabled
- [ ] Minimum TLS version set to 1.2
- [ ] Edge certificates active
- [ ] Origin server certificate created (optional)
- [ ] Certificate uploaded to Azure Key Vault (if created)
- [ ] HTTPS tested on all domains

### Phase 3: Caching Configuration (20 minutes)
- [ ] Browser Cache TTL configured (4 hours recommended)
- [ ] Page Rules created:
  - [ ] Rule for caching API responses (with appropriate TTL)
  - [ ] Rule for bypassing cache on auth routes
  - [ ] Rule for caching static assets aggressively
- [ ] Cache key configuration reviewed
- [ ] Custom cache rules tested
- [ ] "Always Online" enabled

### Phase 4: Security Configuration (25 minutes)
- [ ] Firewall rules configured:
  - [ ] Country blocking (if needed)
  - [ ] IP whitelisting (if needed)
  - [ ] Rate limiting (100 req/min/IP recommended)
  - [ ] Challenge on threat score > 10
- [ ] WAF enabled:
  - [ ] OWASP Core Ruleset enabled
  - [ ] Cloudflare Managed Rulesets enabled
  - [ ] Custom rules created (if needed)
- [ ] Bot Fight Mode enabled
- [ ] DDoS protection verified (automatic with proxy)
- [ ] Security headers configured:
  - [ ] HSTS enabled
  - [ ] X-Content-Type-Options
  - [ ] X-Frame-Options
  - [ ] Referrer-Policy
- [ ] Security scan run and issues addressed

### Phase 5: Performance Optimization (15 minutes)
- [ ] Auto Minify enabled (HTML, CSS, JS)
- [ ] Brotli compression enabled
- [ ] Early Hints enabled
- [ ] HTTP/3 (QUIC) enabled
- [ ] Image optimization considered (Cloudflare Images, optional)
- [ ] Rocket Loader evaluated (may cause issues, test carefully)
- [ ] Polish image optimization considered (optional)

### Phase 6: Analytics Setup (10 minutes)
- [ ] Web Analytics enabled
- [ ] Custom dimensions configured (optional)
- [ ] Logs export configured (optional)
- [ ] Email reports configured
- [ ] Dashboard bookmarked

---

## Initial Deployment

### Phase 1: Dev Environment (1 hour)
- [ ] Code pushed to main branch
- [ ] CI checks pass
- [ ] Container image built and pushed to ACR
- [ ] Image scanned for vulnerabilities (no critical issues)
- [ ] Dev deployment triggered
- [ ] Health check passes
- [ ] Application tested:
  - [ ] Home page loads
  - [ ] Authentication works
  - [ ] Database connectivity verified
  - [ ] API endpoints respond correctly
  - [ ] Static assets load
- [ ] Logs reviewed (no errors)
- [ ] Performance acceptable (response time < 2s)

### Phase 2: Staging Environment (1 hour)
- [ ] Dev image promoted to staging
- [ ] Staging deployment triggered
- [ ] Health check passes
- [ ] Full testing performed:
  - [ ] User registration/login
  - [ ] Core features work
  - [ ] Payment processing (test mode)
  - [ ] Data persistence verified
  - [ ] Session management works
  - [ ] Email notifications sent (if applicable)
- [ ] Performance testing:
  - [ ] Load test performed
  - [ ] Response times acceptable
  - [ ] No memory leaks
- [ ] Security testing:
  - [ ] OWASP top 10 checks
  - [ ] SQL injection tests
  - [ ] XSS prevention verified
  - [ ] CSRF protection working
- [ ] Staging approval obtained

### Phase 3: Production Environment (2 hours)
- [ ] Staging image promoted to production
- [ ] Production deployment approved (if required)
- [ ] Production deployment triggered
- [ ] Health check passes
- [ ] Smoke tests performed:
  - [ ] Home page loads
  - [ ] Authentication works
  - [ ] API health endpoints respond
- [ ] Cloudflare cache purged
- [ ] DNS propagation verified
- [ ] Production URL tested from multiple locations
- [ ] SSL certificate verified (A+ rating on SSL Labs)
- [ ] Performance baseline established
- [ ] Monitoring dashboards showing data
- [ ] Alerts configured and tested
- [ ] Documentation updated with production URLs

---

## Post-Deployment Verification

### Immediate Checks (15 minutes)
- [ ] Application accessible via production URL
- [ ] HTTPS working correctly (no cert errors)
- [ ] All pages loading correctly
- [ ] No JavaScript errors in browser console
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] Sessions persisting correctly
- [ ] Cloudflare showing traffic
- [ ] Azure showing application metrics

### Monitoring Setup (20 minutes)
- [ ] Application Insights showing data
- [ ] Custom metrics configured
- [ ] Log queries tested
- [ ] Alert rules firing correctly (test with dummy data)
- [ ] Notification channels working
- [ ] Cloudflare analytics showing traffic
- [ ] Uptime monitoring configured (external service)

### Security Verification (30 minutes)
- [ ] Security headers present (check with securityheaders.com)
- [ ] SSL Labs scan passes (A+ rating)
- [ ] OWASP ZAP scan completed (no critical issues)
- [ ] Cloudflare security events reviewed
- [ ] No exposed secrets (GitHub secret scanning enabled)
- [ ] Rate limiting tested and working
- [ ] WAF rules tested
- [ ] Database not publicly accessible

### Performance Verification (20 minutes)
- [ ] Page load time < 3 seconds
- [ ] Time to First Byte (TTFB) < 500ms
- [ ] First Contentful Paint < 1.8s
- [ ] Lighthouse score > 90 for performance
- [ ] API response time < 200ms (p95)
- [ ] Database query time acceptable
- [ ] Cloudflare cache hit rate > 70%

### Documentation (30 minutes)
- [ ] Production URLs documented
- [ ] Access credentials documented (in secure location)
- [ ] Runbook created for common operations
- [ ] Incident response plan documented
- [ ] Escalation contacts listed
- [ ] Architecture diagram updated
- [ ] README.md updated with production info

---

## Ongoing Operations

### Daily Tasks
- [ ] Check monitoring dashboards
- [ ] Review error logs
- [ ] Check Cloudflare analytics
- [ ] Verify backups completed
- [ ] Review security alerts

### Weekly Tasks
- [ ] Review application insights
- [ ] Check for dependency updates
- [ ] Review Azure cost analysis
- [ ] Performance trending analysis
- [ ] Security scan run

### Monthly Tasks
- [ ] Database backup restore test
- [ ] Disaster recovery drill
- [ ] Certificate expiration check
- [ ] Access review (users, permissions)
- [ ] Cost optimization review
- [ ] Capacity planning review

---

## Rollback Plan

### Preparation
- [ ] Previous working image tagged
- [ ] Rollback procedure documented
- [ ] Database backup available
- [ ] Rollback tested in staging

### Rollback Steps
1. [ ] Identify issue requiring rollback
2. [ ] Notify stakeholders
3. [ ] Identify last known good deployment
4. [ ] Trigger rollback deployment
5. [ ] Verify rollback successful
6. [ ] Update status page
7. [ ] Post-mortem scheduled

---

## Support Contacts

### Azure Support
- Portal: https://portal.azure.com → Support
- Phone: [Your Azure support number]
- Email: [Your Azure support email]

### Cloudflare Support
- Dashboard: https://dash.cloudflare.com
- Docs: https://support.cloudflare.com
- Community: https://community.cloudflare.com

### GitHub Support
- Docs: https://docs.github.com
- Support: https://support.github.com
- Status: https://www.githubstatus.com

### Internal Contacts
- DevOps Lead: [Name, Email, Phone]
- Security Lead: [Name, Email, Phone]
- Product Owner: [Name, Email, Phone]
- On-Call Engineer: [Rotation schedule/link]

---

## Success Criteria

### Technical Success
- [ ] All health checks passing
- [ ] Zero critical errors in logs
- [ ] Response time p95 < 500ms
- [ ] Availability > 99.9%
- [ ] Zero data loss
- [ ] All features working

### Business Success
- [ ] Users can access the application
- [ ] Transactions processing successfully
- [ ] No customer complaints
- [ ] Performance meets SLA
- [ ] Cost within budget

---

**Checklist Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete  
**Last Updated**: January 9, 2026  
**Next Review**: Weekly during first month, then monthly  
**Owner**: [Your Name/Team]
