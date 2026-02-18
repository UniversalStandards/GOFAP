# GOFAPS Deployment Guide (UpCloud)

This guide provides a production-focused path to run GOFAPS on an UpCloud Server using Docker Compose.

## 1) Provision infrastructure in UpCloud

1. Create a new **Server** in UpCloud:
   - OS: Ubuntu 22.04 LTS
   - Plan: at least `4 vCPU / 8 GB RAM` for production baseline
   - Storage: 80+ GB SSD
   - Network: public IPv4 + private network (if using managed DB/Redis)
2. Assign a DNS name (for example `app.example.com`) to the server public IP.
3. Restrict SSH access with UpCloud firewall/security groups to trusted CIDRs only.

## 2) Install runtime dependencies

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release ufw

# Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

## 3) Deploy application

```bash
sudo mkdir -p /opt/gofap
sudo chown "$USER":"$USER" /opt/gofap
cd /opt/gofap

git clone <your-repository-url> .
cp .env.example .env
```

Populate `.env` with production secrets and endpoints. Do **not** commit `.env`.

## 4) Security hardening

```bash
# Open only required ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

Recommended hardening:
- Store secrets in GitHub Environments and inject during deployment.
- Use managed PostgreSQL/Redis where possible.
- Enable automated security updates (`unattended-upgrades`).
- Terminate TLS via Nginx/Caddy with Let's Encrypt.

## 5) Build and run

```bash
docker compose pull
docker compose build --no-cache
docker compose up -d
```

## 6) Health validation

```bash
docker compose ps
docker compose logs --tail=200
curl -f http://localhost:5000/health || true
```

If your application health endpoint differs, replace `/health` with the correct path.

## 7) CI/CD recommendation for UpCloud

Use the existing GitHub branch protections and GitHub Environments to gate deployments from the protected `main` branch:
- Develop on feature branches and/or `release/*` branches.
- Merge tested changes into `main`.
- Deploy `dev`, `staging`, and `production` environments **from `main`**, with environment‑specific protections (approvals, reviewers, etc.) enforced by GitHub Environments.

Use required approvals configured in GitHub Environments to control which commits from `main` can be promoted to each environment (especially `production`).

To trigger deployment from GitHub, open **Actions → Deploy (Selected Platform) → Run workflow**, select `upcloud`, choose `main` as the git reference (if prompted), and choose your target environment.

## 8) Rollback strategy

- Keep the previous container image tagged and available (for example `your-registry/your-app:2024-01-15`).
- Roll back by explicitly pinning the previous version and then redeploying:
  1. Either **check out** the previous git ref that used the older image tag:

     ```bash
     cd /opt/gofap
     git fetch --all
     git checkout <previous-tag-or-commit>
     ```

     or **edit** your `docker-compose.yml` / override file to set `image: your-registry/your-app:<previous-tag>`.
  2. Apply the rollback:

     ```bash
     docker compose down
     docker compose pull
     docker compose up -d
     ```

For stronger guarantees, maintain immutable image tags and pin them in compose overrides so that each deploy/rollback corresponds to a specific tag.
