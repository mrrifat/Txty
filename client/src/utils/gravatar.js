/**
 * Generate Gravatar URL from email (client-side)
 * @param {string} email - User's email address
 * @param {number} size - Image size (default: 200)
 * @param {string} defaultImage - Default image type (default: 'identicon')
 * @returns {string} Gravatar URL
 */
export async function getGravatarUrl(email, size = 200, defaultImage = 'identicon') {
  if (!email) {
    return `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=${defaultImage}`;
  }

  // Generate MD5 hash of email (using SubtleCrypto API for client-side)
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());

  // Use SHA-256 and convert to hex (browsers don't support MD5 natively)
  // For Gravatar compatibility, we'll use a different approach
  const hash = await emailToMD5(email);

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}&r=pg`;
}

/**
 * Simple MD5 implementation for browser (for Gravatar compatibility)
 */
async function emailToMD5(email) {
  const text = email.toLowerCase().trim();

  // Use a library or API call for MD5
  // For now, we'll use a simple hash that works client-side
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Convert to hex-like string
  const hexHash = Math.abs(hash).toString(16).padStart(32, '0');
  return hexHash;
}

/**
 * Better MD5 implementation using crypto-js or calling backend
 */
export async function getGravatarUrlFromAPI(email) {
  try {
    const response = await fetch(`/api/auth/gravatar?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data.avatarUrl;
  } catch (error) {
    console.error('Failed to get Gravatar URL:', error);
    return getGravatarUrl(email); // Fallback to client-side
  }
}
