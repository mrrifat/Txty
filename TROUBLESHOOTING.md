# Txty Troubleshooting Guide

This guide will help you diagnose and fix common issues with the Txty application.

## Quick Health Check

Run this command to check if everything is working:

```bash
npm run health
```

This will verify:
- ✅ Environment configuration (.env file)
- ✅ Required files exist
- ✅ Dependencies are installed
- ✅ Database initialization
- ✅ Build status
- ✅ API routes loading

---

## Common Issues and Solutions

### 1. Application Won't Start

**Symptom**: Server crashes immediately or won't start

**Solutions**:

#### Check Node.js Version
```bash
node --version  # Should be v18+ or v20+
```

#### Check if Port 3000 is Already in Use
```bash
# On Linux/Mac
lsof -i :3000

# On Windows
netstat -ano | findstr :3000
```

**Fix**: Kill the process or change the PORT in `.env`

#### Missing .env File
```bash
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
```

---

### 2. Database Errors

**Symptom**: "Database locked" or "SQLITE_ERROR"

**Solutions**:

#### Reset Database
```bash
rm txty.db
npm run dev  # Will recreate database
```

#### Check File Permissions
```bash
chmod 664 txty.db  # Read/write for user and group
```

---

### 3. Frontend Build Errors

**Symptom**: Build fails or shows errors

**Solutions**:

#### Clear Node Modules and Reinstall
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Check for Missing Dependencies
```bash
cd client
npm audit fix
npm install
```

---

### 4. JWT Token Errors

**Symptom**: "JWT_SECRET is not configured" or "Invalid token"

**Solutions**:

#### Set JWT_SECRET in .env
```bash
# Edit .env file
JWT_SECRET=your-very-secure-random-string-here-at-least-32-characters
```

**Generate a secure secret**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 5. Gravatar Not Loading

**Symptom**: Avatars don't appear

**Solutions**:

#### Check Email Format
- Ensure user email is valid
- Gravatar uses MD5 hash of lowercase, trimmed email

#### Test Gravatar URL Manually
```bash
curl "https://www.gravatar.com/avatar/00000000000000000000000000000000?s=200"
```

#### Check Network/Firewall
- Ensure `www.gravatar.com` is not blocked
- Check CORS settings

---

### 6. Rate Limiting Issues

**Symptom**: "Too many requests" errors

**Solutions**:

#### Clear Rate Limit (Development Only)
Restart the server - rate limits reset on restart

#### Adjust Rate Limits
Edit `server/middleware/rateLimiter.js` and increase limits:
```javascript
max: 100,  // Increase this number
windowMs: 15 * 60 * 1000,  // Or increase this
```

---

### 7. Syntax Highlighting Not Working

**Symptom**: Code appears as plain text

**Solutions**:

#### Verify Prism.js Loaded
Check browser console for errors

#### Language Not Detected
- Use manual language selection dropdown
- Check `server/utils/languageDetector.js` for supported languages

---

### 8. Dark Mode Not Working

**Symptom**: Theme doesn't change or stuck in one mode

**Solutions**:

#### Clear LocalStorage
```javascript
// In browser console
localStorage.removeItem('theme');
window.location.reload();
```

#### Check Tailwind Config
Verify `tailwind.config.js` has:
```javascript
darkMode: 'class',
```

---

### 9. SEO/Sitemap Issues

**Symptom**: Sitemap not generating or robots.txt not found

**Solutions**:

#### Test Endpoints Directly
```bash
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/robots.txt
```

#### Check Route Order
In `server/index.js`, sitemap routes must be before the `*` catch-all:
```javascript
app.use('/', sitemapRoutes);  // Must be before static files
```

---

### 10. Build Works But Production Fails

**Symptom**: Works in development, fails in production

**Solutions**:

#### Set NODE_ENV
```bash
export NODE_ENV=production  # Linux/Mac
set NODE_ENV=production     # Windows
```

#### Build Client First
```bash
npm run build
npm start
```

#### Check Environment Variables
Ensure all required env vars are set in production:
- `JWT_SECRET`
- `PORT`
- `NODE_ENV`
- `BASE_URL` (for sitemap)

---

## Advanced Debugging

### Enable Detailed Logging

Add to `server/index.js`:
```javascript
if (process.env.DEBUG) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
```

Run with:
```bash
DEBUG=true npm run dev
```

### Check Database Schema

```bash
sqlite3 txty.db ".schema"
```

Expected tables:
- users
- pastes
- folders
- tags
- paste_tags
- likes
- paste_analytics

### Verify All Routes

```bash
npm run server &
curl http://localhost:3000/api/paste/feed/public
curl http://localhost:3000/sitemap.xml
```

---

## Performance Issues

### Slow Database Queries

**Solutions**:

#### Add Indexes
```sql
CREATE INDEX idx_pastes_user_id ON pastes(user_id);
CREATE INDEX idx_pastes_created_at ON pastes(created_at);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_paste_id ON likes(paste_id);
```

#### Limit Results
Already implemented with LIMIT clauses in queries

### Large Bundle Size

**Solutions**:

#### Analyze Bundle
```bash
cd client
npm run build -- --mode=production
```

#### Code Splitting (Future Enhancement)
Implement React.lazy() for routes

---

## Security Checklist

Before deploying to production:

- [ ] Set strong JWT_SECRET (64+ random characters)
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Review rate limits
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Hide error stack traces in production
- [ ] Set secure cookie flags
- [ ] Implement CSP headers

---

## Getting Help

If issues persist:

1. **Run Health Check**: `npm run health`
2. **Check Server Logs**: Look for error messages
3. **Check Browser Console**: For frontend errors
4. **Review Recent Changes**: `git log`
5. **Test in Fresh Directory**: Clone repo again and test

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run health` | Run health check |
| `npm run dev` | Start development server |
| `npm run build` | Build client for production |
| `npm start` | Start production server |
| `npm run test` | Run health check + build |
| `npm run install-all` | Install all dependencies |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `JWT_SECRET` | **Yes** | - | JWT signing secret |
| `NODE_ENV` | No | development | Environment mode |
| `BASE_URL` | No | https://txty.app | Base URL for sitemap |

---

## Known Issues

### Moderate Security Vulnerabilities in Dev Dependencies

**Issue**: esbuild has known vulnerabilities
**Impact**: Development only, not production
**Action**: Monitor for updates, safe to ignore for now

### Browser-Specific Issues

**Safari**: LocalStorage may not work in private mode
**Firefox**: Some CSS animations may be slower
**Chrome**: Works perfectly ✅

---

## Still Need Help?

1. Check the GitHub Issues page
2. Review the logs: `npm run dev` and look for errors
3. Ensure all prerequisites are installed:
   - Node.js 18+
   - npm 9+
   - Git

---

**Last Updated**: 2024
**Version**: 1.0.0
**Maintained by**: Txty Development Team
