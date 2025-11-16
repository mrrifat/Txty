import db from '../db/init.js';

/**
 * Clean up expired pastes from the database
 * @returns {number} Number of pastes deleted
 */
export function cleanupExpiredPastes() {
  try {
    const now = new Date().toISOString();
    const result = db.prepare('DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at < ?').run(now);

    if (result.changes > 0) {
      console.log(`🧹 Cleaned up ${result.changes} expired paste(s)`);
    }

    return result.changes;
  } catch (error) {
    console.error('Error cleaning up expired pastes:', error);
    return 0;
  }
}

/**
 * Start the cleanup job that runs every hour
 */
export function startCleanupJob() {
  // Run cleanup immediately on startup
  cleanupExpiredPastes();

  // Run cleanup every hour (3600000 ms)
  const interval = setInterval(() => {
    cleanupExpiredPastes();
  }, 60 * 60 * 1000); // 1 hour

  console.log('🕐 Cleanup job started - running every hour');

  return interval;
}
