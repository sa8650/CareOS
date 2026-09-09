/**
 * Tiny formatting helpers shared by the React app and the server-side content renderer.
 * Pure JavaScript — no React, no DOM, no database.
 */
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "15:30" -> "3:30 PM" */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = String(timeStr).split(':');
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return '';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m ?? '00'} ${ampm}`;
}

export function formatTimeRange(start, end) {
  if (!start || !end) return '';
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** [0,1] -> "Sun, Mon" */
export function formatVisitingDays(days) {
  const list = Array.isArray(days) ? days : [];
  if (list.length === 0) return 'No visiting days';
  if (list.length === 7) return 'Every day';
  return list.slice().sort((a, b) => a - b).map(d => DAYS_SHORT[d]).join(', ');
}

/** Normalise a list field (array | JSON string | newline/comma text) into string[]. */
export function asList(value, separators = /\r?\n|,/) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(v => String(v ?? '').split(/\r?\n/)).map(v => v.trim()).filter(Boolean);
  let s = String(value).trim();
  if (!s) return [];
  if (s.startsWith('[') || s.startsWith('"')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return asList(parsed, separators);
      if (typeof parsed === 'string') s = parsed;
    } catch { /* plain text */ }
  }
  return s.split(separators).map(x => x.trim()).filter(Boolean);
}
export const asLines = (v) => asList(v, /\r?\n/);

/**
 * Resolve an image reference to a URL.
 *  - full http(s) / data: / blob: URL -> as-is
 *  - stored object key                -> `${base}/api/image?key=...`  (base '' = relative)
 */
export function imageUrl(ref, base = '') {
  if (!ref) return null;
  const s = String(ref).trim();
  if (!s) return null;
  if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:') || s.startsWith('blob:')) return s;
  return `${base}/api/image?key=${encodeURIComponent(s.replace(/^\/+/, ''))}`;
}
