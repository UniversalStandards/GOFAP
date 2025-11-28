# GOFAPS Deployment Guide

Quick reference for deploying GOFAPS in different environments.

**Production hosting decision:** We recommend AWS EC2 as the primary target (Nginx + PM2) for predictable networking, SSL termination, and compatibility with the provided deployment scripts. Lightsail can work for smaller pilots, but EC2 is the maintained path described below.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [AWS EC2 Deployment](#aws-ec2-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- **Node.js**: 20.x or later
- **PostgreSQL**: 15.x or later
- **npm**: 10.x or later

### Quick Development Setup

```bash
# Clone repository
git clone https://github.com/UniversalStandards/GOFAP.git
cd GOFAP

# Run setup script (Linux/Mac)
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# Or manual setup
npm install --legacy-peer-deps
cp .env.example .env
# Edit .env with your configuration
npm run db:push
npm run dev
```

Visit http://localhost:5000

---

## Development Setup

### Manual Setup

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SESSION_SECRET` - Generate with `openssl rand -base64 32`
   - Other optional services as needed

3. **Setup Database**
   ```bash
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Using Docker Compose

```bash
# Start all services (PostgreSQL, Redis, App)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Production Deployment

### Build for Production

```bash
# Install production dependencies
npm install --legacy-peer-deps --production

# Build application
npm run build

# Start production server
npm run start
```

### Environment Configuration

**Required Environment Variables:**

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your_secure_session_secret_min_32_chars
```

**Optional but Recommended:**

```env
# Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Logging
LOG_LEVEL=info

# Additional integrations as needed
```

See `.env.example` for complete list.

---

## Docker Deployment

### Build Docker Image

```bash
docker build -t gofaps:latest .
```

### Run Container

```bash
docker run -d \
  --name gofaps \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -e SESSION_SECRET=... \
  gofaps:latest
```

### With Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# With custom configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## AWS EC2 Deployment

For complete EC2 deployment instructions, see **[EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md)**

### Quick EC2 Setup

1. **Launch EC2 Instance**
   - AMI: Amazon Linux 2023
   - Instance Type: t3.medium minimum
   - Security Group: Ports 22, 80, 443

2. **Install Requirements**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   
   # Install Node.js
   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
   sudo yum install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo yum install -y nginx
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   sudo mkdir -p /var/www/gofaps
   cd /var/www/gofaps
   git clone https://github.com/UniversalStandards/GOFAP.git current
   cd current
   
   # Install and build
   npm install --legacy-peer-deps --production
   npm run build
   
   # Configure environment
   sudo mkdir -p /etc/gofaps
   sudo nano /etc/gofaps/environment
   # Add your environment variables
   
   # Start with PM2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```bash
   sudo cp nginx.conf /etc/nginx/conf.d/gofaps.conf
   # Edit with your domain
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Setup SSL**
   ```bash
   sudo yum install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Monitoring and Maintenance

### Health Checks

```bash
# Basic health check
curl http://localhost:5000/health

# Liveness check
curl http://localhost:5000/health/live

# Readiness check (includes database)
curl http://localhost:5000/health/ready

# Detailed metrics
curl http://localhost:5000/health/detailed
```

### PM2 Management

```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart application
pm2 restart gofaps

# Reload with zero downtime
pm2 reload gofaps

# Stop application
pm2 stop gofaps
```

### Database Backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated backups (via cron)
# See EC2_DEPLOYMENT_GUIDE.md for backup scripts
```

### Log Management

Logs are stored in:
- **Application logs**: `/var/log/gofaps/`
- **Nginx logs**: `/var/log/nginx/`
- **PM2 logs**: `~/.pm2/logs/`

```bash
# View application logs
tail -f /var/log/gofaps/out.log
tail -f /var/log/gofaps/error.log

# View nginx logs
sudo tail -f /var/log/nginx/gofaps_access.log
sudo tail -f /var/log/nginx/gofaps_error.log
```

---

## Troubleshooting

### Application Won't Start

1. **Check environment variables**
   ```bash
   # Validate configuration
   node -e "require('./dist/server/env-validator').validateEnvironment()"
   ```

2. **Check logs**
   ```bash
   pm2 logs --err
   ```

3. **Check database connection**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version()"

# Check if database exists
psql $DATABASE_URL -c "\l"

# Run migrations
npm run db:push
```

### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
kill -9 <PID>

# Or change PORT in environment
export PORT=5001
```

### Build Failures

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Clear build cache
rm -rf dist

# Rebuild
npm run build
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Check error log
sudo tail -f /var/log/nginx/error.log
```

---

## Performance Optimization

### Enable Caching

1. **Install Redis**
   ```bash
   # Via Docker
   docker run -d -p 6379:6379 redis:7-alpine
   
   # Or native installation
   sudo yum install redis -y
   sudo systemctl start redis
   ```

2. **Configure in application**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

### Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_budgets_org ON budgets(organization_id);
CREATE INDEX idx_payments_org ON payments(organization_id);
```

### Enable Compression

Nginx already configured with gzip compression in `nginx.conf`.

---

## Security Checklist

Before going to production, verify:

- [ ] All environment variables are secure
- [ ] SESSION_SECRET is strong (32+ characters)
- [ ] Database uses strong passwords
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured correctly
- [ ] Security headers enabled (via nginx)
- [ ] Rate limiting enabled
- [ ] Logs are being collected
- [ ] Backups are automated
- [ ] Monitoring is set up

See **[SECURITY.md](./SECURITY.md)** for comprehensive security guidelines.

---

## Additional Resources

- **[PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md)** - Complete production readiness audit
- **[EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md)** - Detailed EC2 setup guide
- **[SECURITY.md](./SECURITY.md)** - Security policy and best practices
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development setup guide
- **[README.md](./README.md)** - General project information

---

## Support

- **GitHub Issues**: https://github.com/UniversalStandards/GOFAP/issues
- **Security Issues**: security@universalstandards.org
- **Documentation**: See files listed above

---

**Quick Commands Reference:**

```bash
# Development
npm run dev              # Start development server
npm run check            # TypeScript type checking
npm run test             # Run tests

# Production
npm run build            # Build for production
npm run start            # Start production server
npm run db:push          # Run database migrations

# PM2
pm2 start ecosystem.config.js --env production
pm2 logs
pm2 monit
pm2 restart gofaps
pm2 reload gofaps

# Docker
docker-compose up -d     # Start all services
docker-compose logs -f   # View logs
docker-compose down      # Stop all services
```

---

Last Updated: November 3, 2025
