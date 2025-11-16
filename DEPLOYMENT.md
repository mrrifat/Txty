# Txty Deployment Guide

This guide covers multiple deployment options for the Txty application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment (Recommended)](#docker-deployment-recommended)
4. [Manual Deployment](#manual-deployment)
5. [Cloud Platform Deployments](#cloud-platform-deployments)
6. [Production Checklist](#production-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

- Node.js 18+ (for manual deployment)
- Docker & Docker Compose (for containerized deployment)
- Git
- Domain name (optional, for production)
- SSL certificate (recommended for production)

---

## Environment Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Configure Required Variables

Edit `.env` and set:

```env
# CRITICAL: Generate a strong JWT secret
JWT_SECRET=<your-strong-secret-here>

# Set to production
NODE_ENV=production

# Optional: Set custom port
PORT=3000

# Optional: Your domain (for SEO)
APP_URL=https://yourdomain.com

# Optional: Gravatar API key
GRAVATAR_API_KEY=your-key-here
```

### Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Docker Deployment (Recommended)

### Quick Start

1. **Clone and configure**:
```bash
git clone <your-repo>
cd Txty
cp .env.example .env
# Edit .env with your values
```

2. **Build and run**:
```bash
docker-compose up -d
```

3. **Check health**:
```bash
curl http://localhost:3000/api/health
```

### With Nginx Reverse Proxy

For production with SSL:

```bash
# Run with nginx profile
docker-compose --profile with-nginx up -d
```

**Important**: Configure nginx settings in `nginx/nginx.conf` (see below)

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Remove all data (CAUTION!)
docker-compose down -v
```

---

## Manual Deployment

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install
cd ..
```

### 2. Build Frontend

```bash
npm run build
```

### 3. Set Environment

```bash
export NODE_ENV=production
export JWT_SECRET=<your-secret>
```

### 4. Start Server

```bash
# Production mode
npm start

# Or with PM2 (recommended)
npm install -g pm2
pm2 start server/index.js --name txty
pm2 save
pm2 startup
```

### Using PM2 (Process Manager)

```bash
# Start
pm2 start server/index.js --name txty -i max

# Monitor
pm2 monit

# Logs
pm2 logs txty

# Restart
pm2 restart txty

# Stop
pm2 stop txty
```

---

## Cloud Platform Deployments

### Heroku

1. **Create app**:
```bash
heroku create your-app-name
```

2. **Set environment variables**:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
```

3. **Add buildpack**:
```bash
heroku buildpacks:add heroku/nodejs
```

4. **Deploy**:
```bash
git push heroku main
```

### DigitalOcean App Platform

1. Create new app from GitHub repository
2. Set environment variables in dashboard:
   - `NODE_ENV=production`
   - `JWT_SECRET=<your-secret>`
3. Deploy automatically on push

### AWS EC2

1. **Launch EC2 instance** (Ubuntu 22.04 recommended)

2. **Install Docker**:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

3. **Clone and deploy**:
```bash
git clone <your-repo>
cd Txty
cp .env.example .env
# Configure .env
docker-compose up -d
```

4. **Configure security group**:
   - Allow inbound TCP on port 80 (HTTP)
   - Allow inbound TCP on port 443 (HTTPS)

### Railway

1. Create new project from GitHub
2. Set environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=<your-secret>`
3. Deploy automatically

### Render

1. Create new Web Service
2. Build command: `npm install && cd client && npm install && npm run build`
3. Start command: `npm start`
4. Environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=<your-secret>`

---

## Nginx Configuration

Create `nginx/nginx.conf` for reverse proxy:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream txty_backend {
        server txty:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

        # API routes
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://txty_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # SEO routes (sitemap, robots)
        location ~ ^/(sitemap\.xml|robots\.txt)$ {
            proxy_pass http://txty_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Frontend
        location / {
            limit_req zone=general burst=20 nodelay;
            proxy_pass http://txty_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://txty_backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### SSL Certificate with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Set up auto-renewal
sudo certbot renew --dry-run
```

---

## Production Checklist

### Security

- [ ] Set strong `JWT_SECRET` (64+ random characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (UFW, Security Groups, etc.)
- [ ] Enable rate limiting (already configured)
- [ ] Set `NODE_ENV=production`
- [ ] Disable debug mode
- [ ] Regular security updates
- [ ] Backup database regularly

### Performance

- [ ] Enable gzip compression
- [ ] Configure CDN for static assets (optional)
- [ ] Set up caching headers
- [ ] Optimize database indexes
- [ ] Monitor resource usage

### SEO

- [ ] Set `APP_URL` environment variable
- [ ] Verify sitemap.xml accessible
- [ ] Verify robots.txt configured
- [ ] Submit sitemap to Google Search Console
- [ ] Configure Google Analytics (optional)

### Monitoring

- [ ] Set up health check monitoring
- [ ] Configure logging (PM2, Docker logs, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure error tracking (Sentry, optional)
- [ ] Set up backup automation

---

## Monitoring & Maintenance

### Health Check

```bash
# Check application health
curl https://yourdomain.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "uptime": 12345.67,
#   "environment": "production"
# }
```

### Database Backup

```bash
# Backup SQLite database
docker exec txty-app cp /app/data/txty.db /app/data/txty-backup-$(date +%Y%m%d).db

# Or manually
cp data/txty.db data/txty-backup-$(date +%Y%m%d).db

# Automated backup (cron job)
0 2 * * * /path/to/backup-script.sh
```

### Logs

```bash
# Docker logs
docker-compose logs -f txty

# PM2 logs
pm2 logs txty

# System logs (systemd)
journalctl -u txty -f
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart (Docker)
docker-compose up -d --build

# Or manual
npm install
cd client && npm install && npm run build
pm2 restart txty
```

### Cleanup

```bash
# Clean expired pastes (runs automatically every hour)
# Check server/utils/cleanup.js for details

# Manual cleanup
docker exec txty-app node -e "require('./server/utils/cleanup.js').cleanExpiredPastes()"
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

### Quick Diagnostics

```bash
# Run health check
npm run health

# Check database
sqlite3 data/txty.db "SELECT COUNT(*) FROM pastes;"

# Test build
npm run build

# Check environment
cat .env

# Verify JWT secret is set
echo $JWT_SECRET
```

---

## Support

For issues and questions:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Run `npm run health` for diagnostics
3. Check application logs
4. Review this deployment guide

---

## Performance Tuning

### Node.js

```bash
# Increase memory limit if needed
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

### Database

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pastes_user ON pastes(user_id);
CREATE INDEX IF NOT EXISTS idx_pastes_created ON pastes(created_at);
CREATE INDEX IF NOT EXISTS idx_pastes_public ON pastes(is_public);
```

### PM2 Cluster Mode

```bash
# Use all CPU cores
pm2 start server/index.js -i max --name txty

# Or specific number
pm2 start server/index.js -i 4 --name txty
```

---

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx, HAProxy, or cloud load balancer
2. **Database**: Migrate to PostgreSQL or MySQL for multi-instance support
3. **Session Storage**: Use Redis for JWT blacklist (if implementing logout)
4. **File Storage**: Use S3 or similar for attachments (if added)

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching (Redis)
- Use CDN for static assets

---

## License

MIT
