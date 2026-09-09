import { createSeoRepo } from './api/_lib/seoRepo.js';
import { loadSiteData, resolveSiteUrl } from './api/_lib/siteData.js';
import { sitemapEntries, renderSitemapXml } from '../shared/seo/index.js';

/** GET /sitemap.xml — generated from the current services + SEO records (nothing static). */
export async function onRequestGet(context) {
  const db = context.env.DB;
  const site = await loadSiteData(db);
  const siteUrl = resolveSiteUrl(site.settings, context.request);
  const records = await createSeoRepo(db).getAll();
  const entries = sitemapEntries({ siteUrl, ...site, records, lastmod: site.doctor?.updated_at });
  return new Response(renderSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
