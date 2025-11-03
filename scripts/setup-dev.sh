#!/bin/bash

# GOFAPS Development Setup Script
# This script helps set up the development environment

set -e

echo "════════════════════════════════════════════════════════════"
echo "  GOFAPS Development Environment Setup"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version 18 or higher is required${NC}"
    echo "  Current version: $(node -v)"
    echo "  Please install Node.js 20 LTS from https://nodejs.org/"
    exit 1
else
    echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
fi

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✓ npm version: $(npm -v)${NC}"
fi

# Check PostgreSQL (optional for dev)
echo "Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL not found locally${NC}"
    echo "  You can use Docker Compose or a cloud database"
fi

echo ""
echo "Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from .env.example${NC}"
    echo -e "${YELLOW}⚠ Please edit .env with your configuration${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
fi

echo ""
echo "Generating session secret..."
if command -v openssl &> /dev/null; then
    SESSION_SECRET=$(openssl rand -base64 32)
    if grep -q "SESSION_SECRET=your_session_secret_key" .env; then
        sed -i.bak "s/SESSION_SECRET=your_session_secret_key/SESSION_SECRET=$SESSION_SECRET/" .env
        echo -e "${GREEN}✓ Generated secure session secret${NC}"
    fi
else
    echo -e "${YELLOW}⚠ openssl not found, please set SESSION_SECRET manually${NC}"
fi

echo ""
echo "Setting up database..."
read -p "Do you want to start PostgreSQL with Docker Compose? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
        docker-compose up -d postgres redis
        echo -e "${GREEN}✓ PostgreSQL and Redis started with Docker Compose${NC}"
        echo "  Waiting for PostgreSQL to be ready..."
        sleep 5
        
        # Run migrations
        echo "Running database migrations..."
        npm run db:push
        echo -e "${GREEN}✓ Database migrations completed${NC}"
    else
        echo -e "${RED}✗ Docker or Docker Compose not found${NC}"
        echo "  Please install Docker or set up PostgreSQL manually"
    fi
else
    echo -e "${YELLOW}⚠ Please configure your database in .env${NC}"
fi

echo ""
echo "Running TypeScript check..."
npm run check || echo -e "${YELLOW}⚠ TypeScript check found issues${NC}"

echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}  Setup Complete!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Start the development server: npm run dev"
echo "  3. Open http://localhost:5000 in your browser"
echo ""
echo "Useful commands:"
echo "  npm run dev        - Start development server"
echo "  npm run build      - Build for production"
echo "  npm run test       - Run tests"
echo "  npm run db:push    - Run database migrations"
echo ""
echo "For production deployment, see:"
echo "  - EC2_DEPLOYMENT_GUIDE.md"
echo "  - PRODUCTION_AUDIT.md"
echo "  - SECURITY.md"
echo ""
