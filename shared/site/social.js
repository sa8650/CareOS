/**
 * Social platform helpers — plain JavaScript, shared by the React app and the backend
 * (used for footer links and for the JSON-LD "sameAs" list).
 */
export const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

/** Normalise a social value to a clickable href (handles bare handles / phone numbers). */
export function socialHref(key, value) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  switch (key) {
    case 'whatsapp': return `https://wa.me/${v.replace(/[^\d]/g, '')}`;
    case 'facebook': return `https://facebook.com/${v.replace(/^@/, '')}`;
    case 'instagram': return `https://instagram.com/${v.replace(/^@/, '')}`;
    case 'twitter': return `https://x.com/${v.replace(/^@/, '')}`;
    case 'linkedin': return `https://linkedin.com/in/${v.replace(/^@/, '')}`;
    case 'youtube': return `https://youtube.com/${v.startsWith('@') ? v : '@' + v}`;
    default: return `https://${v}`;
  }
}

/** settings {social_facebook: ...} -> ["https://facebook.com/...", ...] */
export function socialLinks(settings) {
  const s = settings || {};
  return SOCIAL_PLATFORMS.map(p => socialHref(p.key, s[`social_${p.key}`])).filter(Boolean);
}
