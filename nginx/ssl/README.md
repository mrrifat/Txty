# SSL Certificate Setup

This directory should contain your SSL certificates for HTTPS.

## Required Files

- `fullchain.pem` - Full certificate chain
- `privkey.pem` - Private key

## Option 1: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./

# Set permissions
sudo chmod 644 fullchain.pem
sudo chmod 600 privkey.pem
```

## Option 2: Self-Signed (Development Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

**Warning**: Self-signed certificates will show browser warnings. Use only for development/testing.

## Option 3: Commercial Certificate

1. Purchase SSL certificate from provider (e.g., Namecheap, GoDaddy)
2. Download certificate files
3. Place `fullchain.pem` and `privkey.pem` in this directory

## Auto-Renewal (Let's Encrypt)

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up cron job for auto-renewal
sudo crontab -e

# Add this line:
0 3 * * * certbot renew --quiet --post-hook "docker-compose restart nginx"
```

## Security

- Keep `privkey.pem` secure and never commit to git
- Use strong encryption (2048-bit RSA minimum)
- Renew certificates before expiration
- Monitor certificate expiration dates
