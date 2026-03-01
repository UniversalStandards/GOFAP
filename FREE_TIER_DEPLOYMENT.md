# Free Tier Deployment Guide - GitHub + Render + Vercel + PlanetScale

## Overview

This guide provides a complete deployment setup using **100% free tiers** for development and hosting:

- **GitHub Codespaces** - Development environment (60 hours/month free)
- **Render.com** - Backend API hosting (Free tier with PostgreSQL)
- **Vercel** - Frontend hosting (Free unlimited deployments)
- **PlanetScale** - Database (Free 5GB storage)

**Total Cost: $0/month** 🎉

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
└────────────────┬────────────────────────┬───────────────────┘
                 │                        │
        Frontend │                        │ API Requests
                 ▼                        ▼
        ┌─────────────────┐    ┌──────────────────────┐
        │  Vercel (Free)  │    │  Render.com (Free)   │
        │   Static Site   │    │   Node.js Backend    │
        │  React/Vite App │    │   Express API        │
        └─────────────────┘    └──────────┬───────────┘
                                          │
                                Database  │
                                          ▼
                               ┌──────────────────────┐
                               │ PlanetScale (Free)   │
                               │  MySQL Database      │
                               │  5GB Storage         │
                               └──────────────────────┘
```

---

## Prerequisites

1. **GitHub Account** (free)
2. **Render.com Account** (sign up with GitHub)
3. **Vercel Account** (sign up with GitHub)
4. **PlanetScale Account** (sign up with GitHub)

---

## Part 1: Development Setup (GitHub Codespaces)

### Step 1: Launch Codespace

1. Go to your GitHub repository: `https://github.com/UniversalStandards/GOFAP`
2. Click **Code** → **Codespaces** → **Create codespace on main**
3. Wait 2-3 minutes for environment to provision
4. Codespace opens in VS Code (browser or desktop)

### Step 2: Install Dependencies

```bash
# In Codespace terminal
npm install
```

### Step 3: Set Up Local Database

```bash
# Codespaces includes PostgreSQL
# Create database
createdb gofaps_dev

# Set environment variable
echo "DATABASE_URL=postgresql://localhost/gofaps_dev" > .env
echo "NODE_ENV=development" >> .env
echo "PORT=5000" >> .env
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
```

### Step 4: Run Migrations

```bash
npm run db:push
```

### Step 5: Start Development Server

```bash
npm run dev
```

**Access your app:**
- Codespaces will forward port 5000
- Click "Open in Browser" notification
- URL format: `https://<codespace-name>-5000.app.github.dev`

### Codespace Management

**Free Tier Limits:**
- 60 hours/month (120 hours with GitHub Pro)
- Stops after 30 minutes of inactivity
- Data persists between stops

**Commands:**
```bash
# Stop codespace (saves state)
# Just close the browser tab

# Delete codespace (frees up storage)
# GitHub → Codespaces → Delete
```

---

## Part 2: Database Setup (PlanetScale)

### Step 1: Create Database

1. Go to [planetscale.com](https://planetscale.com)
2. Sign in with GitHub
3. Click **New database**
4. Name: `gofaps-db`
5. Region: Choose closest to your users (e.g., `us-east`)
6. Click **Create database**

### Step 2: Create Branches

PlanetScale uses Git-like branches for schema management:

```bash
# Create development branch
pscale branch create gofaps-db development

# Create production branch (main exists by default)
```

### Step 3: Get Connection String

1. In PlanetScale dashboard → `gofaps-db` → **Connect**
2. Select branch: `main`
3. Connect with: **Prisma** (compatible with Drizzle)
4. Copy connection string

**Format:**
```
mysql://user:password@host/database?sslaccept=strict
```

### Step 4: Convert to PostgreSQL-Compatible App

Since PlanetScale uses MySQL, we need to adjust the schema:

**Option A: Use PlanetScale with MySQL Driver**
```bash
npm install mysql2
```

**Option B: Use Render's Free PostgreSQL Instead**
We'll use this option (simpler, keeps existing schema)

---

## Part 3: Backend Deployment (Render.com)

### Step 1: Create Web Service

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click **New +** → **Web Service**
4. Connect to repository: `UniversalStandards/GOFAP`
5. **Configuration:**
   - Name: `gofaps-api`
   - Region: `Oregon (US West)` (free tier available)
   - Branch: `main`
   - Root Directory: `.` (leave empty)
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: **Free**

### Step 2: Add Environment Variables

In Render dashboard → `gofaps-api` → **Environment**:

```bash
NODE_ENV=production
PORT=5000
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
TRUST_PROXY=true
ALLOWED_ORIGINS=https://gofaps.vercel.app
LOG_DIR=/tmp/gofaps-logs

# Database (Render provides free PostgreSQL)
DATABASE_URL=<will-be-added-automatically>

# Optional: Payment providers
STRIPE_SECRET_KEY=<your-key>
STRIPE_PUBLISHABLE_KEY=<your-key>
```

### Step 3: Add PostgreSQL Database

1. In Render dashboard → `gofaps-api` → **Environment**
2. Scroll to **Databases** section
3. Click **New Database**
4. Name: `gofaps-db`
5. Database: `gofaps`
6. User: `gofaps`
7. Region: Same as web service
8. Instance Type: **Free** (1GB storage, expires after 90 days)
9. Click **Create Database**

**Render automatically:**
- Creates `DATABASE_URL` environment variable
- Links database to web service
- Handles connection string

### Step 4: Deploy

1. Click **Create Web Service**
2. Wait 5-10 minutes for initial deployment
3. Render will:
   - Clone repository
   - Run `npm install`
   - Run `npm run build`
   - Start with `npm start`

**Your API URL:** `https://gofaps-api.onrender.com`

### Step 5: Run Database Migrations

**Option A: Render Shell**
```bash
# In Render dashboard → gofaps-api → Shell
npm run db:push
```

**Option B: Local Connection**
```bash
# Get DATABASE_URL from Render environment variables
export DATABASE_URL="<render-postgres-url>"
npm run db:push
```

### Step 6: Verify Health Checks

```bash
curl https://gofaps-api.onrender.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## Part 4: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Build

The app uses Vite for frontend. Ensure `client` directory structure:

```
client/
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   └── ...
└── vite.config.ts
```

### Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **Add New...** → **Project**
4. Import repository: `UniversalStandards/GOFAP`
5. **Configuration:**
   - Framework Preset: **Vite**
   - Root Directory: `.` (Vercel auto-detects)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist/public` (auto-detected)
   - Install Command: `npm install`

### Step 3: Configure Environment Variables

In Vercel project → **Settings** → **Environment Variables**:

```bash
VITE_API_URL=https://gofaps-api.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=<your-key>
```

**Note:** Vite requires `VITE_` prefix for client-side variables.

### Step 4: Update API Base URL in Client

```typescript
// client/src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### Step 5: Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for deployment
3. Vercel automatically:
   - Installs dependencies
   - Builds frontend with Vite
   - Deploys to global CDN
   - Provides HTTPS certificate

**Your Frontend URL:** `https://gofaps.vercel.app`

### Step 6: Configure Custom Domain (Optional)

1. In Vercel → **Settings** → **Domains**
2. Add domain: `gofaps.com`
3. Update DNS records (Vercel provides instructions)
4. SSL certificate auto-provisioned

---

## Part 5: Connect Frontend to Backend

### Update CORS in Backend

Ensure Render backend allows Vercel frontend:

**In `server/index.ts` or environment variables:**
```bash
ALLOWED_ORIGINS=https://gofaps.vercel.app,https://gofaps-preview.vercel.app
```

Redeploy Render service after updating environment variables.

### Test Integration

1. Open frontend: `https://gofaps.vercel.app`
2. Open browser DevTools → Network tab
3. Perform action (e.g., login)
4. Verify API calls to `https://gofaps-api.onrender.com`

---

## Part 6: Continuous Deployment

### Automatic Deployments

Both Render and Vercel automatically deploy on Git push:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Triggers:
# - Vercel rebuilds frontend
# - Render rebuilds backend
```

### Preview Deployments

**Vercel** (automatic):
- Every pull request gets preview URL
- Format: `https://gofaps-git-<branch>.vercel.app`

**Render** (manual):
- Create preview environment in dashboard
- Connect to different branch

---

## Part 7: Monitoring & Maintenance

### Render Free Tier Limitations

**Web Service:**
- Spins down after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- 750 hours/month (sufficient for 24/7 with one service)

**PostgreSQL:**
- 1GB storage
- Expires after 90 days (backup and recreate)
- No automatic backups

**Solutions:**
```bash
# Keep service awake with cron job
# Use cron-job.org (free) to ping every 10 minutes
curl https://gofaps-api.onrender.com/health
```

### Vercel Free Tier Limitations

- 100GB bandwidth/month
- 6,000 build minutes/month
- Unlimited deployments
- 1 concurrent build

### Database Backup Strategy

**Automatic Backup Script:**
```bash
# Run weekly via GitHub Actions
name: Database Backup

on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Backup Database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
      - name: Upload to GitHub
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backup-*.sql
          retention-days: 90
```

### Monitoring

**Render:**
- Built-in metrics (CPU, memory, requests)
- Email alerts for crashes
- Log retention: 7 days

**Vercel:**
- Analytics (free): page views, web vitals
- Error tracking via console
- Deployment history

### Log Access

**Render Logs:**
```bash
# Real-time logs in dashboard
# Or via CLI
render logs -s gofaps-api
```

**Vercel Logs:**
```bash
# Real-time logs in dashboard
# Or via CLI
vercel logs gofaps.vercel.app
```

---

## Part 8: Upgrade Path

When you outgrow free tiers:

### Render Paid Plans

**Starter ($7/month per service):**
- No cold starts
- More CPU/memory
- 400 hours included

**Standard ($25/month per service):**
- Auto-scaling
- Zero-downtime deploys
- 750 hours included

### Vercel Paid Plans

**Pro ($20/month):**
- 1TB bandwidth
- Advanced analytics
- Password protection

### PlanetScale Paid Plans

**Scaler ($39/month):**
- 10GB storage
- Production branches
- Query insights

### Migration to Azure/AWS

When ready for enterprise deployment, use existing guides:
- `AZURE_CLOUDFLARE_DEPLOYMENT.md`
- `EC2_DEPLOYMENT_GUIDE.md`

---

## Troubleshooting

### Issue: Render Service Not Starting

**Check:**
```bash
# In Render dashboard → Logs
# Common issues:
# - Missing environment variables
# - Build command failed
# - Port binding (use PORT env variable)
```

**Solution:**
```bash
# Ensure start command uses PORT env
"start": "node dist/index.js"

# In server/index.ts
const port = parseInt(process.env.PORT || '5000', 10);
```

### Issue: CORS Errors

**Check browser console:**
```
Access to fetch at 'https://gofaps-api.onrender.com'
from origin 'https://gofaps.vercel.app' has been blocked by CORS
```

**Solution:**
```bash
# Add to Render environment variables
ALLOWED_ORIGINS=https://gofaps.vercel.app

# Or update server/security-middleware.ts
const allowedOrigins = [
  'https://gofaps.vercel.app',
  'http://localhost:3000'
];
```

### Issue: Database Connection Failed

**Check:**
```bash
# In Render logs
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# Verify DATABASE_URL format
postgresql://user:pass@host:5432/dbname

# Check database is running (Render → Databases)
# Recreate database link if needed
```

### Issue: Vercel Build Failed

**Check build logs:**
```bash
# Common issues:
# - Missing dependencies
# - TypeScript errors
# - Environment variables not set
```

**Solution:**
```bash
# Test build locally
npm run build

# Check Vercel environment variables
VITE_API_URL=https://gofaps-api.onrender.com
```

---

## Cost Comparison

| Service | Free Tier | Paid Alternative | Savings |
|---------|-----------|------------------|---------|
| GitHub Codespaces | 60 hours/month | Local dev ($0) | $0 |
| Render (Web) | 750 hours/month | Azure App Service ($55/mo) | $55/mo |
| Render (DB) | 1GB PostgreSQL | Azure Database ($25/mo) | $25/mo |
| Vercel | Unlimited | Netlify Pro ($19/mo) | $19/mo |
| **Total** | **$0/month** | **$99/month** | **$99/mo** |

---

## Security Considerations

### Free Tier Security

✅ **Included:**
- HTTPS/TLS (Render & Vercel)
- DDoS protection (Vercel)
- Security headers (implemented in code)
- Rate limiting (implemented in code)

⚠️ **Not Included:**
- WAF (Web Application Firewall)
- Advanced DDoS protection
- Dedicated IP address
- Private networking

### Recommendations

1. **Keep Dependencies Updated:**
   ```bash
   npm audit fix
   npm update
   ```

2. **Use GitHub Security Features:**
   - Dependabot alerts (free)
   - Code scanning (free for public repos)
   - Secret scanning (free for public repos)

3. **Monitor Free Tier Usage:**
   - Set up usage alerts
   - Don't store sensitive data in free database
   - Implement proper backup strategy

---

## Next Steps

1. **Development:**
   - Use Codespaces for feature development
   - Test locally before committing
   - Submit pull requests for team review

2. **Deployment:**
   - Push to `main` branch for production
   - Use preview deployments for testing
   - Monitor application health

3. **Scaling:**
   - Track usage metrics
   - Plan upgrade path when limits approached
   - Consider multi-region deployment

---

## Quick Reference

### URLs
- **Frontend:** https://gofaps.vercel.app
- **Backend API:** https://gofaps-api.onrender.com
- **Health Check:** https://gofaps-api.onrender.com/health
- **Codespace:** https://github.com/UniversalStandards/GOFAP/codespaces

### Commands
```bash
# Local development (Codespaces)
npm install
npm run dev

# Build for production
npm run build

# Database migrations
npm run db:push

# Logs
render logs -s gofaps-api  # Render CLI
vercel logs               # Vercel CLI
```

### Support
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs
- **PlanetScale:** https://planetscale.com/docs
- **GitHub Codespaces:** https://docs.github.com/codespaces

---

**Last Updated:** January 25, 2026  
**Version:** 1.0  
**Maintainer:** DevOps Team
