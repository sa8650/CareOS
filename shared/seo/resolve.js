/**
 * resolveSeo(): defaults (generated from doctor/site data) + admin overrides -> final SEO for one page.
 * Pure function — same result in the browser (SeoManager) and on the server (HTML injection).
 */
import { PAGES, matchPage, normalizePath, pageKey } from './pages.js';
import { buildSeoContext, defaultSeoFor } from './defaults.js';
import { buildJsonLd } from './structuredData.js';

const clean = (v) => (v == null ? '' : String(v)).trim();

function absoluteUrl(value, siteUrl) {
  const v = clean(value);
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (!siteUrl) return v;
  const path = v.startsWith('/') ? v : `/api/image?key=${encodeURIComponent(v)}`;
  return `${siteUrl}${path}`;
}

/**
 * @param {object} args
 * @param {string} args.path        current URL path ("/services/hair-prp")
 * @param {object} args.doctor      public doctor profile
 * @param {object} args.settings    public settings (key/value)
 * @param {array}  args.chambers
 * @param {array}  args.services
 * @param {object} args.records     { [pageKey]: seoRecord }  (admin overrides, may be {})
 * @param {string} args.siteUrl     "https://example.com" (from settings.seo_site_url or the request origin)
 * @param {object} [args.service]   the loaded service for service pages (better defaults)
 * @returns resolved SEO: { key, path, title, description, keywords, canonical, robots, og_title, og_description, og_image,
 *                          og_type, site_name, locale, twitter_card, twitter_site, jsonLd, isDefault: {field: bool} }
 */
export function resolveSeo(args) {
  const path = normalizePath(args.path);
  const match = matchPage(path);
  const key = match ? match.key : 'not_found';
  const ctx = buildSeoContext(args);

  // Resolve service data for dynamic service pages (better defaults + schema).
  let service = args.service || null;
  if (!service && match?.page.key === 'service') service = ctx.services.find(s => s.slug === match.param) || null;

  // A service URL whose slug does not exist (deleted / inactive / typo) must never be indexed.
  // `servicesKnown` tells us the list is authoritative (false while the client is still loading).
  const servicesKnown = args.servicesKnown !== false && Array.isArray(args.services);
  const notFound = !match || (match.page.key === 'service' && servicesKnown && !service);
  if (notFound) return notFoundSeo(ctx, path);

  const defaults = defaultSeoFor(key, ctx, { service });
  // Per-service override first, then a generic "service" template record, then nothing.
  const rec = args.records?.[key] || (match?.page.dynamic ? args.records?.[match.page.key] : null) || {};

  const pick = (field) => clean(rec[field]) || clean(defaults[field]);
  const siteUrl = ctx.siteUrl;

  const title = pick('title');
  const description = pick('description');
  const canonical = clean(rec.canonical) ? absoluteUrl(rec.canonical, siteUrl) : (siteUrl ? `${siteUrl}${path === '/' ? '/' : path}` : '');
  const og_image = absoluteUrl(pick('og_image'), siteUrl);
  const blocked = ['1', 'true', 'yes'].includes(String(ctx.settings?.seo_block_indexing || '').trim().toLowerCase());
  const robots = blocked ? 'noindex, nofollow' : (pick('robots') || 'index, follow');
  const schema_type = clean(rec.schema_type) || defaults.schema_type || 'WebPage';

  const resolved = {
    key,
    path,
    page: match?.page || null,
    title,
    description,
    keywords: pick('keywords'),
    canonical,
    robots,
    og_title: clean(rec.og_title) || title,
    og_description: clean(rec.og_description) || description,
    og_image,
    og_type: match?.page.key === 'service' ? 'article' : 'website',
    site_name: ctx.siteName,
    locale: ctx.locale,
    twitter_card: og_image ? 'summary_large_image' : 'summary',
    twitter_site: ctx.twitter ? (ctx.twitter.startsWith('@') ? ctx.twitter : '@' + ctx.twitter) : '',
    schema_type,
    schema_json: clean(rec.schema_json),
    isDefault: Object.fromEntries(['title', 'description', 'keywords', 'canonical', 'og_title', 'og_description', 'og_image', 'robots', 'schema_type'].map(f => [f, !clean(rec[f])])),
    defaults,
  };
  resolved.jsonLd = buildJsonLd(ctx, resolved, { service });
  return resolved;
}

/**
 * SEO for URLs that are not public pages (unknown routes, unknown service slugs).
 * Title only + noindex — no canonical, no Open Graph, no JSON-LD, never in the sitemap.
 */
export function notFoundSeo(ctx, path = '/') {
  return {
    key: 'not_found', path, page: null, notFound: true, minimal: true,
    title: `Page not found | ${ctx.name}`,
    description: '', keywords: '', canonical: '', og_image: '',
    robots: 'noindex, nofollow',
    og_title: '', og_description: '', og_type: 'website',
    site_name: ctx.siteName, locale: ctx.locale, twitter_card: 'summary', twitter_site: '',
    schema_type: 'none', schema_json: '', jsonLd: null, isDefault: {}, defaults: {},
  };
}

/** Convenience: list all record keys that currently exist as pages (static pages + one per active service). */
export function listPageKeys(services = []) {
  const keys = PAGES.filter(p => !p.dynamic).map(p => p.key);
  for (const s of services) {
    if (s?.slug && (s.is_active === undefined || Number(s.is_active) === 1)) keys.push(pageKey('service', s.slug));
  }
  return keys;
}
