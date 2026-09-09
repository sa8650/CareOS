import { json } from './_middleware.js';
import { createSeoRepo } from './_lib/seoRepo.js';
import { resolveSiteUrl } from './_lib/siteData.js';

/**
 * Public: GET /api/seo            -> { records: {page: record}, site_url }
 *         GET /api/seo?page=home  -> { record, site_url }
 *
 * The frontend combines these overrides with the doctor/settings/services it already
 * loads and resolves the final tags client-side (shared/seo/resolve.js).
 */
export async function onRequestGet(context) {
  const db = context.env.DB;
  const repo = createSeoRepo(db);
  const url = new URL(context.request.url);
  const page = url.searchParams.get('page');

  let siteUrl = '';
  try {
    const row = await db.prepare("SELECT value FROM settings WHERE key = 'seo_site_url'").first();
    siteUrl = resolveSiteUrl({ seo_site_url: row?.value }, context.request);
  } catch { siteUrl = resolveSiteUrl({}, context.request); }

  const body = page ? { record: await repo.get(page), site_url: siteUrl } : { records: await repo.getAll(), site_url: siteUrl };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
