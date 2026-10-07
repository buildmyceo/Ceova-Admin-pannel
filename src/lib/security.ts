/**
 * Security utilities for Ceova Portal
 * Provides defenses against XSS, open redirects, URL protocol injection,
 * and malicious file uploads.
 */

// Blocked dangerous URL schemes
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application/',
  'file:',
  'intent:'
];

/**
 * Validates and sanitizes URLs before rendering in href, src, or window.open
 * Prevents stored and reflected Cross-Site Scripting (XSS) via `javascript:` links.
 */
export function sanitizeUrl(url?: string | null, fallback = ''): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Normalize lowercase without control characters or spaces
  const normalized = trimmed.replace(/[\x00-\x20]/g, '').toLowerCase();

  // Block dangerous schemes
  for (const proto of DANGEROUS_PROTOCOLS) {
    if (normalized.startsWith(proto)) {
      console.warn(`[Security Alert] Blocked dangerous URL scheme: ${proto}`);
      return fallback;
    }
  }

  // Safe web protocols
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:') ||
    normalized.startsWith('blob:') ||
    normalized.startsWith('data:image/jpeg') ||
    normalized.startsWith('data:image/png') ||
    normalized.startsWith('data:image/webp') ||
    normalized.startsWith('data:image/gif')
  ) {
    return trimmed;
  }

  // Relative paths
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }

  // If user provided a domain/URL without protocol, prefix with https://
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return fallback;
}

/**
 * Checks if a string is a valid safe HTTP(S) URL
 */
export function isSafeHttpUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const sanitized = sanitizeUrl(url);
  return sanitized.startsWith('http://') || sanitized.startsWith('https://');
}

/**
 * Generates safe social profile links, sanitizing handles and blocking protocol injection
 */
export function sanitizeSocialLink(platform: string, rawValue?: string | null): string {
  if (!rawValue || typeof rawValue !== 'string') return '';
  const trimmed = rawValue.trim().replace(/^@/, '');
  if (!trimmed) return '';

  // If already a full URL, validate it
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const safe = sanitizeUrl(trimmed);
    return safe;
  }

  // Check for protocol injection attempts
  if (trimmed.includes(':') || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('<')) {
    return '';
  }

  const encodedHandle = encodeURIComponent(trimmed);
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return `https://linkedin.com/in/${encodedHandle}`;
    case 'github':
      return `https://github.com/${encodedHandle}`;
    case 'instagram':
      return `https://instagram.com/${encodedHandle}`;
    case 'twitter':
    case 'x':
      return `https://x.com/${encodedHandle}`;
    default:
      return '';
  }
}

/**
 * Maximum file size limits
 */
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

// Dangerous extensions that must never be uploaded as attachments
const FORBIDDEN_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'php', 'phtml', 'html', 'htm', 'js', 'vbs', 'scr', 'msi', 'jar'
]);

/**
 * Validates uploaded files to prevent server/client side injection
 */
export function validateAttachmentFile(
  file: File, 
  allowedCategory: 'photo' | 'document' | 'any' = 'any'
): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'No file provided.' };

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return { 
      valid: false, 
      error: `Files with extension .${ext} are blocked for security purposes.` 
    };
  }

  if (allowedCategory === 'photo') {
    if (!file.type.startsWith('image/') || ext === 'svg') {
      return { 
        valid: false, 
        error: 'Only standard photo files (JPG, PNG, WebP, GIF) are allowed.' 
      };
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return { 
        valid: false, 
        error: 'Photo file size exceeds the 5 MB limit.' 
      };
    }
  } else {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { 
        valid: false, 
        error: 'File size exceeds the 15 MB limit.' 
      };
    }
  }

  return { valid: true };
}
