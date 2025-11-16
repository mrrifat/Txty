#!/usr/bin/env node

/**
 * Txty Application Health Check Script
 * Performs comprehensive validation of the application
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function xmark() {
  return `${colors.red}✗${colors.reset}`;
}

function warning() {
  return `${colors.yellow}⚠${colors.reset}`;
}

let issuesFound = 0;
let warningsFound = 0;

log('\n🔍 Txty Application Health Check\n', colors.cyan);
log('='.repeat(50), colors.blue);

// 1. Check Environment Variables
log('\n📋 Checking Environment Configuration...', colors.blue);
try {
  const envPath = join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Check JWT_SECRET
    if (envContent.includes('JWT_SECRET=') && !envContent.includes('your-secret-key')) {
      log(`${checkmark()} JWT_SECRET is configured`);
    } else {
      log(`${warning()} JWT_SECRET using default value - change in production!`);
      warningsFound++;
    }

    // Check PORT
    if (envContent.includes('PORT=')) {
      log(`${checkmark()} PORT is configured`);
    }

    // Check NODE_ENV
    if (envContent.includes('NODE_ENV=')) {
      log(`${checkmark()} NODE_ENV is set`);
    }
  } else {
    log(`${warning()} .env file not found - will use defaults`);
    warningsFound++;
  }
} catch (error) {
  log(`${xmark()} Error checking .env: ${error.message}`, colors.red);
  issuesFound++;
}

// 2. Check Required Files
log('\n📁 Checking Required Files...', colors.blue);
const requiredFiles = [
  'server/index.js',
  'server/db/init.js',
  'server/routes/auth.js',
  'server/routes/paste.js',
  'server/routes/sitemap.js',
  'server/middleware/auth.js',
  'server/middleware/rateLimiter.js',
  'server/utils/cleanup.js',
  'server/utils/gravatar.js',
  'server/utils/languageDetector.js',
  'client/src/App.jsx',
  'client/src/main.jsx',
  'client/index.html',
  'package.json',
];

requiredFiles.forEach(file => {
  const filePath = join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    log(`${checkmark()} ${file}`);
  } else {
    log(`${xmark()} Missing: ${file}`, colors.red);
    issuesFound++;
  }
});

// 3. Check Dependencies
log('\n📦 Checking Dependencies...', colors.blue);
try {
  const packageJson = JSON.parse(fs.readFileSync(join(__dirname, '../package.json'), 'utf8'));
  const clientPackageJson = JSON.parse(fs.readFileSync(join(__dirname, '../client/package.json'), 'utf8'));

  // Server dependencies
  const serverDeps = Object.keys(packageJson.dependencies || {});
  log(`${checkmark()} Server dependencies: ${serverDeps.length} packages`);

  // Client dependencies
  const clientDeps = Object.keys(clientPackageJson.dependencies || {});
  log(`${checkmark()} Client dependencies: ${clientDeps.length} packages`);

  // Check critical dependencies
  const criticalDeps = ['express', 'better-sqlite3', 'bcryptjs', 'jsonwebtoken', 'nanoid'];
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      log(`${checkmark()} ${dep} installed`);
    } else {
      log(`${xmark()} Missing critical dependency: ${dep}`, colors.red);
      issuesFound++;
    }
  });
} catch (error) {
  log(`${xmark()} Error checking dependencies: ${error.message}`, colors.red);
  issuesFound++;
}

// 4. Check Database Setup
log('\n🗄️  Checking Database...', colors.blue);
try {
  const { initDatabase } = await import('../server/db/init.js');
  initDatabase();
  log(`${checkmark()} Database initialization successful`);

  const dbPath = join(__dirname, '../txty.db');
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    log(`${checkmark()} Database file exists (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    log(`${warning()} Database file will be created on first run`);
  }
} catch (error) {
  log(`${xmark()} Database error: ${error.message}`, colors.red);
  issuesFound++;
}

// 5. Check Build Status
log('\n🏗️  Checking Build Status...', colors.blue);
const distPath = join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  if (files.length > 0) {
    log(`${checkmark()} Client built successfully (${files.length} files)`);
  } else {
    log(`${warning()} Client dist folder empty - run 'npm run build'`);
    warningsFound++;
  }
} else {
  log(`${warning()} Client not built - run 'npm run build'`);
  warningsFound++;
}

// 6. Check API Routes
log('\n🛣️  Checking API Routes...', colors.blue);
try {
  const authRoutes = await import('../server/routes/auth.js');
  const pasteRoutes = await import('../server/routes/paste.js');
  const sitemapRoutes = await import('../server/routes/sitemap.js');
  log(`${checkmark()} Auth routes loaded`);
  log(`${checkmark()} Paste routes loaded`);
  log(`${checkmark()} Sitemap routes loaded`);
} catch (error) {
  log(`${xmark()} Routes error: ${error.message}`, colors.red);
  issuesFound++;
}

// 7. Summary
log('\n' + '='.repeat(50), colors.blue);
log('\n📊 Health Check Summary\n', colors.cyan);

if (issuesFound === 0 && warningsFound === 0) {
  log(`${checkmark()} All checks passed! Application is healthy.`, colors.green);
  log('\n🚀 You can start the server with: npm run dev\n', colors.cyan);
} else {
  if (issuesFound > 0) {
    log(`${xmark()} Found ${issuesFound} issue(s) that need attention`, colors.red);
  }
  if (warningsFound > 0) {
    log(`${warning()} Found ${warningsFound} warning(s)`, colors.yellow);
  }

  if (issuesFound === 0) {
    log('\n✨ No critical issues found. Warnings are recommendations.', colors.green);
    log('🚀 You can start the server with: npm run dev\n', colors.cyan);
  } else {
    log('\n🔧 Please fix the issues before starting the server.\n', colors.yellow);
  }
}

log('='.repeat(50), colors.blue);

process.exit(issuesFound > 0 ? 1 : 0);
