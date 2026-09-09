export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

export function formatTimeRange(start, end) {
  if (!start || !end) return '';
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatPrice(price) {
  if (!price && price !== 0) return '';
  return `$${Number(price).toFixed(0)}`;
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function statusColor(status) {
  const colors = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    rejected: 'badge-rejected',
  };
  return colors[status] || 'badge-pending';
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// [0,1] -> "Sun, Mon"
export function formatVisitingDays(days) {
  const list = Array.isArray(days) ? days : [];
  if (list.length === 0) return 'No visiting days';
  if (list.length === 7) return 'Every day';
  return list.slice().sort((a, b) => a - b).map(d => DAYS_SHORT[d]).join(', ');
}

// Labels for resolved schedule statuses (see functions/api/_lib/schedule.js)
export const SCHEDULE_STATUS_LABEL = {
  available: 'Available',
  full: 'Full',
  off: 'Off',
  closed: 'Closed',
};

// Local YYYY-MM-DD (avoids the UTC shift of toISOString)
export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Generate <option> values for time selects (every 15 minutes)
export const TIME_OPTIONS = (() => {
  const out = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      out.push({ value: v, label: formatTime(v) });
    }
  }
  return out;
})();

/**
 * Resolve an image reference stored in the DB to a browser URL.
 *  - full http(s) URL         -> returned as-is
 *  - data:/blob: URL          -> returned as-is
 *  - R2 object key            -> served through /api/image?key=...
 */
export function imageUrl(ref) {
  if (!ref) return null;
  const s = String(ref).trim();
  if (!s) return null;
  if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:') || s.startsWith('blob:')) return s;
  return `/api/image?key=${encodeURIComponent(s.replace(/^\/+/, ''))}`;
}

/** Social platforms supported in Admin → Settings (key = settings column suffix). */
// Social helpers live in shared/site/social.js (also used by the SEO structured data); re-exported here.
export { SOCIAL_PLATFORMS, socialHref } from '../../shared/site/social.js';

/** Build a tel: link from a human formatted phone number. */
export function telHref(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

/** Normalise a list field from the API (array | JSON string | newline/comma text) into string[]. */
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
