import express from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from '../db/init.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Create paste
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, password, expiresIn } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const id = nanoid(10);
    const userId = req.user ? req.user.id : null;
    let hashedPassword = null;
    let expiresAt = null;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (expiresIn) {
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

    db.prepare('INSERT INTO pastes (id, title, content, password, user_id, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      id,
      title || null,
      content,
      hashedPassword,
      userId,
      expiresAt ? expiresAt.toISOString() : null
    );

    res.json({ id, message: 'Paste created successfully' });
  } catch (error) {
    console.error('Create paste error:', error);
    res.status(500).json({ error: 'Failed to create paste' });
  }
});

// Get paste
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(id);

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    // Check if expired
    if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
      db.prepare('DELETE FROM pastes WHERE id = ?').run(id);
      return res.status(404).json({ error: 'Paste has expired' });
    }

    // Increment view count
    db.prepare('UPDATE pastes SET views = views + 1 WHERE id = ?').run(id);

    // If password protected, don't send content yet
    if (paste.password) {
      return res.json({
        id: paste.id,
        title: paste.title,
        created_at: paste.created_at,
        views: paste.views + 1,
        passwordProtected: true
      });
    }

    res.json({
      id: paste.id,
      title: paste.title,
      content: paste.content,
      created_at: paste.created_at,
      views: paste.views + 1,
      passwordProtected: false
    });
  } catch (error) {
    console.error('Get paste error:', error);
    res.status(500).json({ error: 'Failed to retrieve paste' });
  }
});

// Unlock password-protected paste
router.post('/:id/unlock', async (req, res) => {
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

export default router;
