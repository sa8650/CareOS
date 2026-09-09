/**
 * sitemap.xml / robots.txt builders — pure functions.
 * The backend adapter fetches services/records from *its* database and calls these.
 */
import { PAGES, DISALLOW_PATHS, pageKey } from './pages.js';
import { resolveSeo } from './resolve.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isoDate = (v) => {
  if (!v) return undefined;
  const d = new Date(String(v).includes('T') ? v : String(v).replace(' ', 'T') + 'Z');
  return isNaN(d) ? undefined : d.toISOString().slice(0, 10);
};
const noindex = (rec) => /noindex/i.test(rec?.robots || '');

/**
 * Build sitemap entries. Pages whose *resolved* robots (default or override) contain "noindex"
 * are excluded, and each entry's <loc> is the resolved canonical URL.
 *
 * @param {object} args
 * @param {string} args.siteUrl   "https://example.com"
 * @param {array}  args.services  active services [{ slug, updated_at }]
 * @param {object} args.records   SEO records keyed by page ({ home: {...}, 'service:x': {...} })
 * @param {object} [args.doctor]  doctor profile (for default resolution)
 * @param {object} [args.settings]
 * @param {array}  [args.chambers]
 * @param {string} [args.lastmod] fallback lastmod for static pages (e.g. doctor.updated_at)
 * @returns {Array<{loc, lastmod, changefreq, priority}>}
 */
export function isIndexingBlocked(settings) {
  return ['1', 'true', 'yes'].includes(String(settings?.seo_block_indexing || '').trim().toLowerCase());
}

export function sitemapEntries({ siteUrl, services = [], records = {}, doctor, settings, chambers, lastmod } = {}) {
  const base = String(siteUrl || '').replace(/\/+$/, '');
  const out = [];
  if (isIndexingBlocked(settings)) return out;   // staging / not launched: empty sitemap
  const push = (page, path, rec, itemLastmod) => {
    const seo = resolveSeo({ path, doctor, settings, chambers, services, records, siteUrl: base });
    if (noindex(seo) || seo.notFound) return;
    const loc = seo.canonical || `${base}${path}`;
    // A canonical pointing to another host means "that URL is the original" — not ours to list.
    if (base && !loc.startsWith(base + '/') && loc !== base) return;
    // Cross-page canonicals (e.g. /services/x canonicalised to /services) would duplicate entries.
    if (out.some(e => e.loc === loc)) return;
    out.push({
      loc,
      lastmod: isoDate(rec?.updated_at) || isoDate(itemLastmod) || isoDate(lastmod),
      changefreq: page.changefreq, priority: page.priority,
    });
  };
  for (const p of PAGES) {
    if (!p.sitemap || p.noindex) continue;
    if (p.dynamic) {
      if (p.key !== 'service') continue;
      for (const s of services) {
        if (!s?.slug || (s.is_active !== undefined && Number(s.is_active) !== 1)) continue;
        push(p, `/services/${encodeURIComponent(s.slug)}`, records[pageKey('service', s.slug)] || records.service, s.updated_at);
      }
    } else {
      push(p, p.path, records[p.key]);
    }
  }
  return out;
}

export function renderSitemapXml(entries) {
  const urls = entries.map(e =>
    `  <url>\n    <loc>${esc(e.loc)}</loc>` +
    (e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : '') +
    (e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : '') +
    (e.priority != null ? `\n    <priority>${Number(e.priority).toFixed(1)}</priority>` : '') +
    `\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * @param {string} siteUrl
 * @param {object} [opts]
 * @param {boolean} [opts.blockAll]  true = "Disallow: /" (staging / not launched yet)
 */
export function renderRobotsTxt(siteUrl, { blockAll = false } = {}) {
  const base = String(siteUrl || '').replace(/\/+$/, '');
  if (blockAll) return `User-agent: *\nDisallow: /\n`;
  const lines = ['User-agent: *', 'Allow: /', ...DISALLOW_PATHS.map(p => `Disallow: ${p}`)];
  if (base) lines.push('', `Sitemap: ${base}/sitemap.xml`);
  return lines.join('\n') + '\n';
}
