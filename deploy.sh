#!/bin/bash

# Txty Deployment Script
# This script helps deploy Txty in production

set -e  # Exit on error

echo "🚀 Txty Deployment Script"
echo "========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env

    echo -e "${YELLOW}⚠️  Please edit .env and set your configuration, especially:${NC}"
    echo "   - JWT_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
    echo "   - NODE_ENV=production"
    echo ""
    read -p "Press Enter after configuring .env..."
fi

# Check if JWT_SECRET is set
if grep -q "your-secret-key-change-this-in-production" .env; then
    echo -e "${RED}Error: JWT_SECRET is not configured!${NC}"
    echo "Generating random JWT_SECRET..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    echo -e "${GREEN}✓ JWT_SECRET generated${NC}"
fi

# Check if NODE_ENV is production
if ! grep -q "NODE_ENV=production" .env; then
    echo "Setting NODE_ENV to production..."
    sed -i "s/NODE_ENV=.*/NODE_ENV=production/" .env
    echo -e "${GREEN}✓ NODE_ENV set to production${NC}"
fi

echo ""
echo "Deployment Options:"
echo "1) Docker (Recommended)"
echo "2) Manual (PM2)"
echo "3) Docker with Nginx"
echo "4) Exit"
echo ""
read -p "Select deployment method (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🐳 Deploying with Docker..."

        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}Error: Docker is not installed!${NC}"
            echo "Install Docker: https://docs.docker.com/get-docker/"
            exit 1
        fi

        # Build and run
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d

        echo ""
        echo -e "${GREEN}✓ Deployment complete!${NC}"
        echo ""
        echo "Access your app at: http://localhost:3000"
        echo "Health check: curl http://localhost:3000/api/health"
        echo ""
        echo "View logs: docker-compose logs -f"
        ;;

    2)
        echo ""
        echo "📦 Manual deployment with PM2..."

        # Check if Node.js is installed
        if ! command -v node &> /dev/null; then
            echo -e "${RED}Error: Node.js is not installed!${NC}"
            exit 1
        fi

        # Install dependencies
        echo "Installing dependencies..."
        npm install
        cd client && npm install && cd ..

        # Build frontend
        echo "Building frontend..."
        npm run build

        # Install PM2 if not already installed
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            npm install -g pm2
        fi

        # Stop existing process
        pm2 stop txty 2>/dev/null || true
        pm2 delete txty 2>/dev/null || true

        # Start with PM2
        pm2 start server/index.js --name txty -i max
        pm2 save

        echo ""
        echo -e "${GREEN}✓ Deployment complete!${NC}"
        echo ""
        echo "PM2 status: pm2 status"
        echo "View logs: pm2 logs txty"
        echo "Monitor: pm2 monit"
        ;;

    3)
        echo ""
        echo "🐳 Deploying with Docker + Nginx..."

        # Check if SSL certificates exist
        if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then
            echo -e "${YELLOW}⚠️  SSL certificates not found!${NC}"
            echo "You need to set up SSL certificates first."
            echo "See nginx/ssl/README.md for instructions."
            echo ""
            read -p "Do you want to generate self-signed certificates for testing? (y/n): " gen_ssl

            if [ "$gen_ssl" = "y" ]; then
                echo "Generating self-signed certificate..."
                openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                    -keyout nginx/ssl/privkey.pem \
                    -out nginx/ssl/fullchain.pem \
                    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
                echo -e "${GREEN}✓ Self-signed certificate generated${NC}"
                echo -e "${YELLOW}⚠️  Remember: Self-signed certs will show browser warnings!${NC}"
            else
                echo "Please set up SSL certificates and run this script again."
                exit 1
            fi
        fi

        # Deploy with Nginx
        docker-compose --profile with-nginx down
        docker-compose --profile with-nginx build --no-cache
        docker-compose --profile with-nginx up -d

        echo ""
        echo -e "${GREEN}✓ Deployment complete!${NC}"
        echo ""
        echo "Access your app at: https://localhost"
        echo "Health check: curl https://localhost/api/health"
        echo ""
        echo "View logs: docker-compose logs -f"
        ;;

    4)
        echo "Exiting..."
        exit 0
        ;;

    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

# Run health check
echo ""
echo "Running health check..."
sleep 5  # Wait for services to start

if command -v curl &> /dev/null; then
    curl -s http://localhost:3000/api/health | grep -q "healthy" && \
        echo -e "${GREEN}✓ Application is healthy!${NC}" || \
        echo -e "${YELLOW}⚠️  Health check failed. Check logs for details.${NC}"
else
    echo -e "${YELLOW}⚠️  curl not installed, skipping health check${NC}"
fi

echo ""
echo "Deployment script completed!"
