import express from 'express';
import db from '../db/init.js';

const router = express.Router();

// Generate XML sitemap
router.get('/sitemap.xml', (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || 'https://txty.app';

    // Get all public pastes
    const publicPastes = db.prepare(`
      SELECT id, custom_url, updated_at, created_at
      FROM pastes
      WHERE is_public = 1 AND is_burned = 0 AND password IS NULL
      ORDER BY created_at DESC
      LIMIT 1000
    `).all();

    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += generateUrlEntry(baseUrl, '1.0', 'daily', new Date().toISOString());

    // Explore page
    xml += generateUrlEntry(`${baseUrl}/explore`, '0.9', 'daily', new Date().toISOString());

    // Login/Register
    xml += generateUrlEntry(`${baseUrl}/login`, '0.5', 'monthly');
    xml += generateUrlEntry(`${baseUrl}/register`, '0.5', 'monthly');

    // Public pastes
    publicPastes.forEach(paste => {
      const url = `${baseUrl}/paste/${paste.custom_url || paste.id}`;
      const lastmod = paste.updated_at || paste.created_at;
      xml += generateUrlEntry(url, '0.8', 'weekly', lastmod);
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Generate robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://txty.app';

  const robotsTxt = `# Txty Robots.txt
User-agent: *
Allow: /
Allow: /explore
Allow: /paste/
Disallow: /dashboard
Disallow: /login
Disallow: /register
Disallow: /api/

# Crawl-delay for bots
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Block bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /
`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

// Helper function to generate URL entry
function generateUrlEntry(url, priority = '0.5', changefreq = 'weekly', lastmod = null) {
  let entry = '  <url>\n';
  entry += `    <loc>${escapeXml(url)}</loc>\n`;
  if (lastmod) {
    entry += `    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>\n`;
  }
  entry += `    <changefreq>${changefreq}</changefreq>\n`;
  entry += `    <priority>${priority}</priority>\n`;
  entry += '  </url>\n';
  return entry;
}

// Escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

export default router;
