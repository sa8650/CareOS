import { json, parseBody } from '../../_middleware.js';
import { createSeoRepo, SEO_TABLE_MISSING } from '../../_lib/seoRepo.js';
import { loadSiteData, resolveSiteUrl } from '../../_lib/siteData.js';
import { listPageKeys, resolveSeo, pathForKey } from '../../../../shared/seo/index.js';
import { validateSeoRecord, normalizeSeoRecord } from '../../../../shared/seo/schema.js';

/**
 * Admin SEO service (getAllSEO / updateSEO / deleteSEO):
 *   GET    /api/admin/seo             -> { ready, site_url, pages: [{ key, path, label, record, resolved }], site: {...} }
 *   PUT    /api/admin/seo             -> body { page, ...fields }  (upsert)      -> { success, record }
 *   DELETE /api/admin/seo?page=home   -> remove overrides (back to defaults)     -> { success }
 */
export async function onRequestGet(context) {
  const db = context.env.DB;
  const repo = createSeoRepo(db);
  const site = await loadSiteData(db);
  const siteUrl = resolveSiteUrl(site.settings, context.request);
  const [records, ready] = await Promise.all([repo.getAll(), repo.isReady()]);

  const keys = listPageKeys(site.services);
  // Also expose any stored records whose page no longer exists (e.g. deleted service) so they can be cleaned up.
  for (const k of Object.keys(records)) if (!keys.includes(k)) keys.push(k);

  const pages = keys.map(key => {
    const path = pathForKey(key) || '/';
    const resolved = resolveSeo({ path, ...site, records, siteUrl });
    return {
      key, path,
      label: key.startsWith('service:') ? `Service: ${site.services.find(s => `service:${s.slug}` === key)?.name || key.slice(8)}` : (resolved.page?.label || key),
      orphan: !listPageKeys(site.services).includes(key),
      record: records[key] || null,
      resolved: {
        title: resolved.title, description: resolved.description, keywords: resolved.keywords, canonical: resolved.canonical,
        og_title: resolved.og_title, og_description: resolved.og_description, og_image: resolved.og_image,
        robots: resolved.robots, schema_type: resolved.schema_type, isDefault: resolved.isDefault,
      },
    };
  });

  return json({
    ready, site_url: siteUrl, warning: ready ? null : SEO_TABLE_MISSING,
    pages,
    site: {
      doctor_name: site.doctor?.name || '', specialty: site.doctor?.title || '',
      settings: Object.fromEntries(Object.entries(site.settings).filter(([k]) => k.startsWith('seo_') || ['clinic_name', 'address'].includes(k))),
    },
  });
}

export async function onRequestPut(context) {
  const body = await parseBody(context.request);
  if (!body?.page) return json({ error: 'page is required' }, 400);

  let rec;
  try { rec = normalizeSeoRecord(body); } catch (err) { return json({ error: err.message }, 400); }
  const errors = validateSeoRecord(rec);
  if (errors.length) return json({ error: errors.join('; ') }, 400);

  const repo = createSeoRepo(context.env.DB);
  try {
    const record = await repo.upsert(rec.page, rec);
    return json({ success: true, record });
  } catch (err) {
    if (/no such table/i.test(err?.message || '')) return json({ error: SEO_TABLE_MISSING }, 500);
    return json({ error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const page = new URL(context.request.url).searchParams.get('page');
  if (!page) return json({ error: 'page is required' }, 400);
  const repo = createSeoRepo(context.env.DB);
  try {
    await repo.remove(page);
    return json({ success: true });
  } catch (err) {
    if (/no such table/i.test(err?.message || '')) return json({ error: SEO_TABLE_MISSING }, 500);
    return json({ error: err.message }, 500);
  }
}
