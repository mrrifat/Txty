import crypto from 'crypto';

/**
 * Generate Gravatar URL from email
 * @param {string} email - User's email address
 * @param {number} size - Image size (default: 200)
 * @param {string} defaultImage - Default image type (default: 'identicon')
 * @returns {string} Gravatar URL
 */
export function getGravatarUrl(email, size = 200, defaultImage = 'identicon') {
  if (!email) {
    return `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=${defaultImage}`;
  }

  // Gravatar requires MD5 hash of lowercase, trimmed email
  const hash = crypto
    .createHash('md5')
    .update(email.toLowerCase().trim())
    .digest('hex');

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}

/**
 * Get Gravatar profile data using Gravatar API
 * API Key: 6709:gk-zR0w594bZ3iWqDkUoWieBWhhpCZDFh9aDfbA8YCL0NGvsuW6inaELpOeqd0N3
 * @param {string} email - User's email address
 * @returns {Promise<object>} Gravatar profile data
 */
export async function getGravatarProfile(email) {
  if (!email) return null;

  const hash = crypto
    .createHash('md5')
    .update(email.toLowerCase().trim())
    .digest('hex');

  try {
    // Gravatar API endpoint
    const response = await fetch(`https://api.gravatar.com/v3/profiles/${hash}`, {
      headers: {
        'Authorization': 'Bearer gk-zR0w594bZ3iWqDkUoWieBWhhpCZDFh9aDfbA8YCL0NGvsuW6inaELpOeqd0N3'
      }
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch Gravatar profile:', error);
  }

  return null;
}

/**
 * Get various Gravatar default image types
 */
export const GRAVATAR_DEFAULTS = {
  IDENTICON: 'identicon',  // Geometric pattern based on email hash
  MONSTERID: 'monsterid',  // Generated monster
  WAVATAR: 'wavatar',      // Generated faces
  RETRO: 'retro',          // 8-bit arcade style
  ROBOHASH: 'robohash',    // Generated robot
  BLANK: 'blank',          // Transparent PNG
  MP: 'mp',                // Mystery person silhouette
  FOUR_OH_FOUR: '404'      // Return 404 if no image
};
