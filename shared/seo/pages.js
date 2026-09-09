/**
 * Public page registry — the single source of truth for "which pages have SEO".
 *
 * Plain JavaScript, no React / no provider code, so it can be imported by:
 *   - the React app        (SeoManager, Admin → SEO Settings)
 *   - the backend adapter  (sitemap.xml, robots.txt, HTML meta injection)
 *
 * Add a new public page here (one line) and it automatically gets:
 *   defaults, an entry in the admin SEO editor, and a sitemap URL.
 *
 * `key`       stable identifier stored in the database
 * `path`      route path ('' for dynamic pages — resolved per record, e.g. service slugs)
 * `pattern`   regex to match a URL path to this page (dynamic pages)
 * `sitemap`   include in sitemap.xml (noindex pages are excluded automatically)
 * `changefreq`/`priority`  sitemap hints
 */
export const PAGES = [
  { key: 'home',        label: 'Home',              path: '/',            sitemap: true,  changefreq: 'weekly',  priority: 1.0 },
  { key: 'about',       label: 'About',             path: '/about',       sitemap: true,  changefreq: 'monthly', priority: 0.8 },
  { key: 'services',    label: 'Services',          path: '/services',    sitemap: true,  changefreq: 'weekly',  priority: 0.9 },
  { key: 'service',     label: 'Service page',      path: '',             sitemap: true,  changefreq: 'monthly', priority: 0.8,
    pattern: /^\/services\/([^/]+)\/?$/, dynamic: true, paramName: 'slug' },
  { key: 'appointment', label: 'Book Appointment',  path: '/appointment', sitemap: true,  changefreq: 'monthly', priority: 0.9 },
  { key: 'contact',     label: 'Contact',           path: '/contact',     sitemap: true,  changefreq: 'monthly', priority: 0.7 },
  { key: 'privacy',     label: 'Privacy Policy',    path: '/privacy',     sitemap: true,  changefreq: 'yearly',  priority: 0.2 },
  // Transactional pages: never indexed, never in the sitemap.
  { key: 'appointment_success', label: 'Appointment Success', path: '', sitemap: false, noindex: true,
    pattern: /^\/appointment\/success\/([^/]+)\/?$/, dynamic: true, paramName: 'id' },
];

/** Paths that must never be indexed (admin area, API). Used by robots.txt. */
export const DISALLOW_PATHS = ['/admin', '/api/', '/appointment/success/'];

/** Build the stable record key for a page (dynamic pages embed their param, e.g. "service:hair-prp"). */
export function pageKey(pageOrKey, param) {
  const key = typeof pageOrKey === 'string' ? pageOrKey : pageOrKey.key;
  return param ? `${key}:${param}` : key;
}

/** Split "service:hair-prp" -> { base: "service", param: "hair-prp" } */
export function splitKey(recordKey) {
  const i = String(recordKey || '').indexOf(':');
  if (i === -1) return { base: recordKey, param: null };
  return { base: recordKey.slice(0, i), param: recordKey.slice(i + 1) };
}

/** Normalise a URL path: strip query/hash and trailing slash (except root). */
export function normalizePath(path) {
  let p = String(path || '/').split(/[?#]/)[0] || '/';
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p;
}

/**
 * Match a URL path to a registry page.
 * @returns {{ page, param, key, path } | null}
 */
export function matchPage(path) {
  const p = normalizePath(path);
  for (const page of PAGES) {
    if (page.dynamic) {
      const m = page.pattern.exec(p);
      if (m) {
        const param = decodeURIComponent(m[1]);
        return { page, param, key: pageKey(page, param), path: p };
      }
    } else if (page.path === p) {
      return { page, param: null, key: page.key, path: p };
    }
  }
  return null;
}

/** Path for a page key (+ optional param for dynamic pages). */
export function pathForKey(recordKey) {
  const { base, param } = splitKey(recordKey);
  const page = PAGES.find(x => x.key === base);
  if (!page) return null;
  if (!page.dynamic) return page.path;
  if (base === 'service' && param) return `/services/${encodeURIComponent(param)}`;
  if (base === 'appointment_success' && param) return `/appointment/success/${encodeURIComponent(param)}`;
  return null;
}
