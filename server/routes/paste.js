import express from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from '../db/init.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';
import { pasteCreationLimiter, unlockLimiter } from '../middleware/rateLimiter.js';
import { detectLanguage } from '../utils/languageDetector.js';

const router = express.Router();

// Create paste
router.post('/', pasteCreationLimiter, authenticateToken, async (req, res) => {
  try {
    const {
      title, content, password, expiresIn, customUrl, language,
      tags, folderId, isPublic, maxViews
    } = req.body;

    // Validate content
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    if (content.length > 1000000) { // 1MB limit
      return res.status(400).json({ error: 'Content is too large (max 1MB)' });
    }

    // Validate title
    if (title && typeof title !== 'string') {
      return res.status(400).json({ error: 'Title must be a string' });
    }

    if (title && title.length > 200) {
      return res.status(400).json({ error: 'Title is too long (max 200 characters)' });
    }

    // Validate custom URL (only for authenticated users)
    if (customUrl) {
      if (!req.user) {
        return res.status(403).json({ error: 'Custom URLs require authentication' });
      }
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(customUrl)) {
        return res.status(400).json({ error: 'Custom URL must be 3-30 characters (letters, numbers, - and _ only)' });
      }
      const existing = db.prepare('SELECT id FROM pastes WHERE custom_url = ?').get(customUrl);
      if (existing) {
        return res.status(400).json({ error: 'Custom URL already taken' });
      }
    }

    // Validate expiresIn
    const validExpirations = ['1h', '1d', '7d', '30d', 'never'];
    if (expiresIn && !validExpirations.includes(expiresIn)) {
      return res.status(400).json({ error: 'Invalid expiration time' });
    }

    const id = nanoid(10);
    const userId = req.user ? req.user.id : null;
    let hashedPassword = null;
    let expiresAt = null;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (expiresIn && expiresIn !== 'never') {
      const now = new Date();
      switch (expiresIn) {
        case '1h':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case '1d':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '7d':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Auto-detect language if not provided
    const detectedLanguage = language || detectLanguage(content);

    db.prepare(`
      INSERT INTO pastes (
        id, custom_url, title, content, language, password, user_id,
        folder_id, expires_at, is_public, max_views
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      customUrl || null,
      title || null,
      content,
      detectedLanguage,
      hashedPassword,
      userId,
      folderId || null,
      expiresAt ? expiresAt.toISOString() : null,
      isPublic !== false ? 1 : 0,
      maxViews || null
    );

    // Handle tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags.slice(0, 10)) { // Max 10 tags
        if (typeof tagName === 'string' && tagName.length <= 30) {
          // Insert tag if doesn't exist
          db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(tagName.toLowerCase());
          const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName.toLowerCase());
          if (tag) {
            db.prepare('INSERT INTO paste_tags (paste_id, tag_id) VALUES (?, ?)').run(id, tag.id);
          }
        }
      }
    }

    const url = customUrl || id;
    res.json({ id, url, language: detectedLanguage, message: 'Paste created successfully' });
  } catch (error) {
    console.error('Create paste error:', error);
    res.status(500).json({ error: 'Failed to create paste' });
  }
});

// Get paste (by ID or custom URL)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Try to find by ID first, then by custom URL
    let paste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(id);
    if (!paste) {
      paste = db.prepare('SELECT * FROM pastes WHERE custom_url = ?').get(id);
    }

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    // Check if burned
    if (paste.is_burned) {
      return res.status(404).json({ error: 'This paste has been burned and is no longer available' });
    }

    // Check if expired before incrementing views
    if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
      db.prepare('DELETE FROM pastes WHERE id = ?').run(paste.id);
      return res.status(404).json({ error: 'Paste has expired' });
    }

    // Check max views (burn after reading)
    if (paste.max_views && paste.views >= paste.max_views) {
      db.prepare('UPDATE pastes SET is_burned = 1 WHERE id = ?').run(paste.id);
      return res.status(404).json({ error: 'This paste has reached maximum views and is no longer available' });
    }

    // Track analytics
    const viewerIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'] || req.headers['referrer'];

    db.prepare('INSERT INTO paste_analytics (paste_id, viewer_ip, user_agent, referer) VALUES (?, ?, ?, ?)').run(
      paste.id,
      viewerIp,
      userAgent,
      referer
    );

    // Increment view count only for valid pastes
    db.prepare('UPDATE pastes SET views = views + 1 WHERE id = ?').run(paste.id);
    paste.views += 1;

    // Get tags
    const tags = db.prepare(`
      SELECT t.name FROM tags t
      JOIN paste_tags pt ON t.id = pt.tag_id
      WHERE pt.paste_id = ?
    `).all(paste.id).map(t => t.name);

    // Get likes count
    const likesCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE paste_id = ?').get(paste.id).count;

    // If password protected, don't send content yet
    if (paste.password) {
      return res.json({
        id: paste.id,
        customUrl: paste.custom_url,
        title: paste.title,
        language: paste.language,
        created_at: paste.created_at,
        views: paste.views,
        likes: likesCount,
        tags,
        passwordProtected: true
      });
    }

    res.json({
      id: paste.id,
      customUrl: paste.custom_url,
      title: paste.title,
      content: paste.content,
      language: paste.language,
      created_at: paste.created_at,
      updated_at: paste.updated_at,
      views: paste.views,
      likes: likesCount,
      tags,
      forkedFrom: paste.forked_from,
      passwordProtected: false
    });
  } catch (error) {
    console.error('Get paste error:', error);
    res.status(500).json({ error: 'Failed to retrieve paste' });
  }
});

// Unlock password-protected paste
router.post('/:id/unlock', unlockLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const paste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(id);

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    if (!paste.password) {
      return res.status(400).json({ error: 'Paste is not password protected' });
    }

    const validPassword = await bcrypt.compare(password, paste.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({
      id: paste.id,
      title: paste.title,
      content: paste.content,
      created_at: paste.created_at,
      views: paste.views
    });
  } catch (error) {
    console.error('Unlock paste error:', error);
    res.status(500).json({ error: 'Failed to unlock paste' });
  }
});

// Get user's pastes
router.get('/user/my-pastes', authenticateToken, requireAuth, (req, res) => {
  try {
    const pastes = db.prepare('SELECT id, title, created_at, views, expires_at FROM pastes WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(pastes);
  } catch (error) {
    console.error('Get user pastes error:', error);
    res.status(500).json({ error: 'Failed to retrieve pastes' });
  }
});

// Delete paste
router.delete('/:id', authenticateToken, requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const paste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(id);

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    if (paste.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this paste' });
    }

    db.prepare('DELETE FROM pastes WHERE id = ?').run(id);
    res.json({ message: 'Paste deleted successfully' });
  } catch (error) {
    console.error('Delete paste error:', error);
    res.status(500).json({ error: 'Failed to delete paste' });
  }
});

// Fork paste
router.post('/:id/fork', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const originalPaste = db.prepare('SELECT * FROM pastes WHERE id = ? OR custom_url = ?').get(id, id);

    if (!originalPaste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    if (!originalPaste.is_public) {
      return res.status(403).json({ error: 'Cannot fork private paste' });
    }

    const newId = nanoid(10);
    const language = detectLanguage(originalPaste.content);

    db.prepare(`
      INSERT INTO pastes (
        id, title, content, language, user_id, forked_from, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      newId,
      `Fork of ${originalPaste.title || 'Untitled'}`,
      originalPaste.content,
      language,
      req.user.id,
      originalPaste.id
    );

    res.json({ id: newId, message: 'Paste forked successfully' });
  } catch (error) {
    console.error('Fork paste error:', error);
    res.status(500).json({ error: 'Failed to fork paste' });
  }
});

// Like/Unlike paste
router.post('/:id/like', authenticateToken, requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const paste = db.prepare('SELECT id FROM pastes WHERE id = ? OR custom_url = ?').get(id, id);

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND paste_id = ?').get(req.user.id, paste.id);

    if (existing) {
      // Unlike
      db.prepare('DELETE FROM likes WHERE user_id = ? AND paste_id = ?').run(req.user.id, paste.id);
      res.json({ liked: false, message: 'Paste unliked' });
    } else {
      // Like
      db.prepare('INSERT INTO likes (user_id, paste_id) VALUES (?, ?)').run(req.user.id, paste.id);
      res.json({ liked: true, message: 'Paste liked' });
    }
  } catch (error) {
    console.error('Like paste error:', error);
    res.status(500).json({ error: 'Failed to like/unlike paste' });
  }
});

// Get public feed
router.get('/feed/public', (req, res) => {
  try {
    const { page = 1, limit = 20, language, tag } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT DISTINCT p.id, p.custom_url, p.title, p.language, p.created_at, p.views,
             (SELECT COUNT(*) FROM likes WHERE paste_id = p.id) as likes
      FROM pastes p
      WHERE p.is_public = 1 AND p.password IS NULL AND p.is_burned = 0
    `;
    const params = [];

    if (language) {
      query += ' AND p.language = ?';
      params.push(language);
    }

    if (tag) {
      query += ` AND p.id IN (
        SELECT pt.paste_id FROM paste_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE t.name = ?
      )`;
      params.push(tag.toLowerCase());
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const pastes = db.prepare(query).all(...params);

    // Get tags for each paste
    const pastesWithTags = pastes.map(paste => {
      const tags = db.prepare(`
        SELECT t.name FROM tags t
        JOIN paste_tags pt ON t.id = pt.tag_id
        WHERE pt.paste_id = ?
      `).all(paste.id).map(t => t.name);

      return { ...paste, tags };
    });

    res.json(pastesWithTags);
  } catch (error) {
    console.error('Get public feed error:', error);
    res.status(500).json({ error: 'Failed to retrieve public feed' });
  }
});

// Search pastes
router.get('/search/query', authenticateToken, (req, res) => {
  try {
    const { q, userId } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${q}%`;
    let query = `
      SELECT id, custom_url, title, language, created_at, views
      FROM pastes
      WHERE (title LIKE ? OR content LIKE ?)
    `;
    const params = [searchTerm, searchTerm];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    } else if (req.user) {
      // If authenticated but no userId specified, search user's pastes
      query += ' AND user_id = ?';
      params.push(req.user.id);
    } else {
      // Anonymous users can only search public pastes
      query += ' AND is_public = 1 AND password IS NULL';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const results = db.prepare(query).all(...params);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search pastes' });
  }
});

// Get paste analytics
router.get('/:id/analytics', authenticateToken, requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const paste = db.prepare('SELECT * FROM pastes WHERE id = ? OR custom_url = ?').get(id, id);

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    if (paste.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to view analytics' });
    }

    // Get view analytics grouped by date
    const viewsByDate = db.prepare(`
      SELECT DATE(viewed_at) as date, COUNT(*) as count
      FROM paste_analytics
      WHERE paste_id = ?
      GROUP BY DATE(viewed_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(paste.id);

    // Get total unique IPs
    const uniqueViews = db.prepare(`
      SELECT COUNT(DISTINCT viewer_ip) as count
      FROM paste_analytics
      WHERE paste_id = ?
    `).get(paste.id).count;

    // Get top referers
    const topReferers = db.prepare(`
      SELECT referer, COUNT(*) as count
      FROM paste_analytics
      WHERE paste_id = ? AND referer IS NOT NULL
      GROUP BY referer
      ORDER BY count DESC
      LIMIT 10
    `).all(paste.id);

    res.json({
      totalViews: paste.views,
      uniqueViews,
      viewsByDate,
      topReferers,
      likes: db.prepare('SELECT COUNT(*) as count FROM likes WHERE paste_id = ?').get(paste.id).count
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

// Folder management - Create folder
router.post('/folders', authenticateToken, requireAuth, (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.length < 1 || name.length > 50) {
      return res.status(400).json({ error: 'Folder name must be 1-50 characters' });
    }

    const result = db.prepare('INSERT INTO folders (name, user_id) VALUES (?, ?)').run(name, req.user.id);
    res.json({ id: result.lastInsertRowid, name, message: 'Folder created successfully' });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Get user's folders
router.get('/folders', authenticateToken, requireAuth, (req, res) => {
  try {
    const folders = db.prepare(`
      SELECT f.*, COUNT(p.id) as paste_count
      FROM folders f
      LEFT JOIN pastes p ON f.id = p.folder_id
      WHERE f.user_id = ?
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `).all(req.user.id);
    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to retrieve folders' });
  }
});

// Delete folder
router.delete('/folders/:id', authenticateToken, requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (folder.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this folder' });
    }

    // Set folder_id to NULL for all pastes in this folder
    db.prepare('UPDATE pastes SET folder_id = NULL WHERE folder_id = ?').run(id);
    db.prepare('DELETE FROM folders WHERE id = ?').run(id);

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Move paste to folder
router.patch('/:id/folder', authenticateToken, requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body;

    const paste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(id);

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    if (paste.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to modify this paste' });
    }

    if (folderId) {
      const folder = db.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?').get(folderId, req.user.id);
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }

    db.prepare('UPDATE pastes SET folder_id = ? WHERE id = ?').run(folderId || null, id);
    res.json({ message: 'Paste moved successfully' });
  } catch (error) {
    console.error('Move paste error:', error);
    res.status(500).json({ error: 'Failed to move paste' });
  }
});

// Get user's liked pastes
router.get('/user/liked', authenticateToken, requireAuth, (req, res) => {
  try {
    const likedPastes = db.prepare(`
      SELECT p.id, p.custom_url, p.title, p.language, p.created_at, p.views, l.created_at as liked_at
      FROM pastes p
      JOIN likes l ON p.id = l.paste_id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `).all(req.user.id);
    res.json(likedPastes);
  } catch (error) {
    console.error('Get liked pastes error:', error);
    res.status(500).json({ error: 'Failed to retrieve liked pastes' });
  }
});

export default router;
