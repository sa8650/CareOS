import { resolveSiteUrl } from './api/_lib/siteData.js';
import { renderRobotsTxt, isIndexingBlocked } from '../shared/seo/index.js';

/** GET /robots.txt — Admin → SEO → "Block search engines" turns the whole site to Disallow: / */
export async function onRequestGet(context) {
  const db = context.env.DB;
  let settings = {};
  try {
    const { results } = await db.prepare("SELECT key, value FROM settings WHERE key IN ('seo_site_url', 'seo_block_indexing')").all();
    for (const r of results) settings[r.key] = r.value;
  } catch { /* defaults */ }
  const siteUrl = resolveSiteUrl(settings, context.request);
  const blockAll = isIndexingBlocked(settings);
  return new Response(renderRobotsTxt(siteUrl, { blockAll }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
