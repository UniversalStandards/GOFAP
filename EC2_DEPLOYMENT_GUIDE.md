# GOFAPS EC2 Deployment Guide

Complete step-by-step guide for deploying GOFAPS to Amazon Linux 2 EC2 instance.

## Prerequisites

- AWS Account with EC2 access
- Domain name (optional but recommended)
- SSH key pair for EC2 access
- Basic Linux and AWS knowledge

---

## Part 1: AWS Infrastructure Setup

### Step 1: Launch EC2 Instance

1. **Log into AWS Console** → EC2 Dashboard

2. **Launch Instance**:
   - **AMI**: Amazon Linux 2023 (or Amazon Linux 2)
   - **Instance Type**: t3.medium (minimum) or t3.large (recommended)
   - **Key Pair**: Select or create new SSH key pair
   - **Network Settings**:
     - VPC: Default or custom
     - Auto-assign Public IP: Enable
     - Security Group: Create new (see below)

3. **Security Group Configuration**:
   ```
   Inbound Rules:
   - SSH (22) from My IP
   - HTTP (80) from Anywhere IPv4 and IPv6
   - HTTPS (443) from Anywhere IPv4 and IPv6
   - PostgreSQL (5432) from Security Group (for RDS)
   
   Outbound Rules:
   - All traffic to Anywhere
   ```

4. **Storage**: 30GB gp3 SSD minimum

5. **Launch Instance** and note the Public IP address

### Step 2: Set Up RDS PostgreSQL Database

1. **Navigate to RDS** → Create database

2. **Configuration**:
   - **Engine**: PostgreSQL 15.x or later
   - **Template**: Production or Dev/Test
   - **Instance**: db.t3.micro (dev) or db.t3.small (production)
   - **Storage**: 20GB SSD, enable autoscaling
   - **Multi-AZ**: Enable for production
   - **VPC**: Same as EC2 instance
   - **Public Access**: No
   - **VPC Security Group**: Create new
   - **Database Name**: gofaps
   - **Master Username**: Choose secure username
   - **Master Password**: Generate strong password

3. **Security Group for RDS**:
   ```
   Inbound Rules:
   - PostgreSQL (5432) from EC2 Security Group
   ```

4. **Save** endpoint URL, username, and password

### Step 3: Configure Elastic IP (Optional but Recommended)

```bash
1. EC2 → Elastic IPs → Allocate Elastic IP address
2. Associate with your EC2 instance
```

### Step 4: Configure Domain (Optional)

1. **Route 53** or your DNS provider:
   ```
   A Record: your-domain.com → EC2 Elastic IP
   A Record: www.your-domain.com → EC2 Elastic IP
   ```

---

## Part 2: Server Configuration

### Step 1: Connect to EC2 Instance

```bash
# Replace with your key file and EC2 IP
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

### Step 2: Update System

```bash
sudo yum update -y
sudo yum install -y git vim htop
```

### Step 3: Install Node.js

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 4: Install PM2 Globally

```bash
sudo npm install -g pm2
pm2 --version
```

### Step 5: Install and Configure Nginx

```bash
# Install nginx
sudo amazon-linux-extras install nginx1 -y  # Amazon Linux 2
# OR
sudo yum install nginx -y  # Amazon Linux 2023

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### Step 6: Install PostgreSQL Client (for management)

```bash
sudo yum install -y postgresql15
```

---

## Part 3: Application Deployment

### Step 1: Create Application Directory

```bash
# Create directory structure
sudo mkdir -p /var/www/gofaps
sudo mkdir -p /var/log/gofaps
sudo chown -R ec2-user:ec2-user /var/www/gofaps
sudo chown -R ec2-user:ec2-user /var/log/gofaps
```

### Step 2: Clone Repository

```bash
cd /var/www/gofaps
git clone https://github.com/UniversalStandards/GOFAP.git current
cd current
```

### Step 3: Install Dependencies

```bash
npm install --legacy-peer-deps --production
```

### Step 4: Configure Environment Variables

```bash
# Create environment file
sudo mkdir -p /etc/gofaps
sudo vim /etc/gofaps/environment
```

Add the following (replace with your actual values):

```bash
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/gofaps

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your_secure_session_secret_here

# Replit Auth / OIDC configuration
REPL_ID=your_oidc_client_id
REPLIT_DOMAINS=finance.example.com
# Optional: override when using a custom issuer
ISSUER_URL=https://replit.com/oidc

# Payment Providers (add as needed)
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# Optional: Other integrations
# AWS_ACCESS_KEY_ID=your_aws_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret
# SMTP_HOST=your_smtp_host
# SMTP_USER=your_smtp_user
# SMTP_PASSWORD=your_smtp_password
```

**Authentication guidance**
- Register the application in Replit Auth (or your chosen OIDC provider) with redirect URI `https://<your-domain>/api/callback`.
- Set `REPLIT_DOMAINS` to every hostname that will front this EC2 deployment (comma separated).
- If you use a provider other than Replit, replace `ISSUER_URL` with the issuer metadata URL they provide.

**Security**: Set proper permissions

```bash
sudo chmod 600 /etc/gofaps/environment
sudo chown ec2-user:ec2-user /etc/gofaps/environment
```

### Step 5: Build Application

```bash
cd /var/www/gofaps/current
npm run build
```

### Step 6: Run Database Migrations

```bash
# Load environment variables
export $(cat /etc/gofaps/environment | xargs)

# Run migrations
npm run db:push
```

### Step 7: Configure PM2

```bash
# Update ecosystem.config.js with correct paths
vim ecosystem.config.js
```

Update the `error_file` and `out_file` paths if needed.

```bash
# Start application with PM2
pm2 start ecosystem.config.js --env production

# Check status
pm2 status
pm2 logs

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup systemd -u ec2-user --hp /home/ec2-user
# Run the command it outputs
```

---

## Part 4: Nginx Configuration

### Step 1: Configure Nginx

```bash
# Copy nginx configuration
sudo cp /var/www/gofaps/current/nginx.conf /etc/nginx/conf.d/gofaps.conf

# Edit configuration with your domain
sudo vim /etc/nginx/conf.d/gofaps.conf
```

Update the following:
- Replace `your-domain.com` with your actual domain
- Update SSL certificate paths (after obtaining certificates)

### Step 2: Test Nginx Configuration

```bash
sudo nginx -t
```

### Step 3: Install SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Start nginx
sudo systemctl start nginx

# Set up auto-renewal
sudo certbot renew --dry-run
```

### Step 4: Restart Nginx

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## Part 5: Systemd Service (Optional Alternative to PM2 Startup)

### Step 1: Install Systemd Service

```bash
# Copy service file
sudo cp /var/www/gofaps/current/gofaps.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable gofaps

# Start service
sudo systemctl start gofaps

# Check status
sudo systemctl status gofaps
```

---

## Part 6: Post-Deployment Configuration

### Step 1: Configure Log Rotation

```bash
sudo vim /etc/logrotate.d/gofaps
```

Add:

```
/var/log/gofaps/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ec2-user ec2-user
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Step 2: Set Up CloudWatch Logs (Optional)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### Step 3: Configure Firewall

```bash
# Amazon Linux 2 uses firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Step 4: Configure Automatic Updates

```bash
sudo yum install -y yum-cron
sudo systemctl enable yum-cron
sudo systemctl start yum-cron
```

---

## Part 7: Monitoring and Maintenance

### Health Check

```bash
# Test health endpoint
curl http://localhost:5000/health
curl https://your-domain.com/health
```

### Monitor Application

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs
pm2 logs --lines 100

# Application logs
tail -f /var/log/gofaps/out.log
tail -f /var/log/gofaps/error.log

# Nginx logs
sudo tail -f /var/log/nginx/gofaps_access.log
sudo tail -f /var/log/nginx/gofaps_error.log
```

### Common PM2 Commands

```bash
pm2 list                    # List all applications
pm2 restart gofaps         # Restart application
pm2 reload gofaps          # Reload with zero downtime
pm2 stop gofaps            # Stop application
pm2 delete gofaps          # Delete from PM2
pm2 logs gofaps            # View logs
pm2 monit                  # Monitor resources
```

---

## Part 8: Deployment Updates

### Manual Update Process

```bash
# 1. Navigate to application directory
cd /var/www/gofaps/current

# 2. Pull latest changes
git pull origin main

# 3. Install dependencies
npm install --legacy-peer-deps --production

# 4. Build application
npm run build

# 5. Run migrations (if any)
export $(cat /etc/gofaps/environment | xargs)
npm run db:push

# 6. Reload application with zero downtime
pm2 reload ecosystem.config.js --env production

# 7. Verify deployment
pm2 logs
curl http://localhost:5000/health
```

### Automated Deployment (with PM2 Deploy)

```bash
# From your local machine
pm2 deploy ecosystem.config.js production setup
pm2 deploy ecosystem.config.js production
```

---

## Part 9: Backup and Disaster Recovery

### Database Backups

```bash
# Create backup script
sudo vim /usr/local/bin/backup-gofaps-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/gofaps"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gofaps_$DATE.sql.gz"

# Load database URL
export $(cat /etc/gofaps/environment | grep DATABASE_URL | xargs)

# Extract connection details from DATABASE_URL
# postgresql://username:password@host:port/database
PGPASSWORD=$(echo $DATABASE_URL | sed -e 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
PGHOST=$(echo $DATABASE_URL | sed -e 's/.*@\([^:]*\):.*/\1/')
PGPORT=$(echo $DATABASE_URL | sed -e 's/.*:\([0-9]*\)\/.*/\1/')
PGDATABASE=$(echo $DATABASE_URL | sed -e 's/.*\/\(.*\)/\1/')
PGUSER=$(echo $DATABASE_URL | sed -e 's/.*:\/\/\([^:]*\):.*/\1/')

export PGPASSWORD PGHOST PGPORT PGDATABASE PGUSER

# Create backup
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE | gzip > $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "gofaps_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-gofaps-db.sh

# Test backup
sudo /usr/local/bin/backup-gofaps-db.sh

# Schedule daily backup
sudo crontab -e
```

Add:

```
0 2 * * * /usr/local/bin/backup-gofaps-db.sh >> /var/log/gofaps/backup.log 2>&1
```

### Application Backup

```bash
# Backup application files
tar -czf /var/backups/gofaps/gofaps-app-$(date +%Y%m%d).tar.gz \
    -C /var/www/gofaps/current \
    --exclude=node_modules \
    --exclude=dist \
    .
```

---

## Part 10: Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs --err

# Check if port is in use
sudo netstat -tlnp | grep 5000

# Check environment variables
pm2 env 0

# Check disk space
df -h

# Check memory
free -m
```

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check RDS security group
# Ensure EC2 security group is allowed

# Check if database exists
psql $DATABASE_URL -c "\l"
```

### Nginx Issues

```bash
# Check nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates
```

### Performance Issues

```bash
# Check CPU and memory
htop

# Check application metrics
pm2 monit

# Check nginx connections
sudo netstat -an | grep :80 | wc -l
sudo netstat -an | grep :443 | wc -l

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Part 11: Security Checklist

- [ ] SSH key-only authentication (disable password auth)
- [ ] Firewall configured and enabled
- [ ] SSL/TLS certificates installed and auto-renewing
- [ ] Environment variables secured (not in code)
- [ ] Database in private subnet
- [ ] Regular security updates enabled
- [ ] CloudTrail logging enabled
- [ ] Monitoring and alerts configured
- [ ] Backups tested and working
- [ ] Security group rules minimal and specific

---

## Part 12: Performance Optimization

### Enable Redis Caching (Optional)

```bash
# Install Redis
sudo amazon-linux-extras install redis6 -y
sudo systemctl start redis
sudo systemctl enable redis

# Test Redis
redis-cli ping  # Should return PONG
```

### Configure Connection Pooling

Update `/etc/gofaps/environment`:

```bash
# Add database pool settings
DATABASE_MAX_CONNECTIONS=20
DATABASE_IDLE_TIMEOUT=30000
```

---

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/UniversalStandards/GOFAP/issues
- **Security**: security@universalstandards.org
- **Documentation**: See PRODUCTION_AUDIT.md and SECURITY.md

---

**Deployment Checklist**: See PRODUCTION_AUDIT.md for complete production readiness checklist.

**Last Updated**: November 3, 2025
