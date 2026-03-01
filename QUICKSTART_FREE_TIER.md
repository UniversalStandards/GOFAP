# Quick Start - Free Tier Deployment

Deploy GOFAPS for **$0/month** using free tiers from GitHub, Render, and Vercel.

## 30-Minute Setup

### 1. GitHub Codespaces (2 minutes)
```bash
# Click: Code → Codespaces → Create codespace
# Wait for environment to load
npm install
npm run dev
# Access forwarded port URL
```

### 2. Render Backend (10 minutes)
```bash
# Go to render.com, sign in with GitHub
# New Web Service → Connect GOFAP repo
# Settings:
#   Build: npm install && npm run build
#   Start: npm start
#   Type: Free
# Add PostgreSQL database (free)
# Deploy
```

### 3. Vercel Frontend (5 minutes)
```bash
# Go to vercel.com, sign in with GitHub
# Import GOFAP repo
# Framework: Vite (auto-detected)
# Environment: VITE_API_URL=https://your-app.onrender.com
# Deploy
```

### 4. Connect & Test (3 minutes)
```bash
# Update CORS on Render:
ALLOWED_ORIGINS=https://your-app.vercel.app

# Visit: https://your-app.vercel.app
# Test login/signup
```

## Architecture

```
Frontend (Vercel)  →  Backend (Render)  →  PostgreSQL (Render)
   FREE                   FREE                   FREE
  Static               Node.js API            1GB Database
```

## Free Tier Limits

| Service | Limit | Notes |
|---------|-------|-------|
| Codespaces | 60 hrs/month | Development only |
| Render Web | 750 hrs/month | Cold starts after 15min |
| Render DB | 1GB, 90 days | Backup regularly |
| Vercel | 100GB bandwidth | Unlimited deploys |

## URLs After Setup

- **Frontend:** `https://gofaps-abc123.vercel.app`
- **Backend:** `https://gofaps-api.onrender.com`
- **Health Check:** `https://gofaps-api.onrender.com/health`

## Full Documentation

See `FREE_TIER_DEPLOYMENT.md` for complete guide with troubleshooting.

## Upgrade Path

When ready for production:
- **Render Starter:** $7/month (no cold starts)
- **Azure/AWS:** See `AZURE_CLOUDFLARE_DEPLOYMENT.md`

---

**Total Cost: $0/month** 🎉
