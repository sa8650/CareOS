/**
 * SEO service — the frontend's only door to SEO data.
 *
 *   getSEO(page)       -> stored override record for one page (or null)
 *   getAllSEO()        -> { records, site_url }
 *   updateSEO(page, d) -> save overrides (admin)
 *   deleteSEO(page)    -> remove overrides (admin)
 *   getAdminOverview() -> pages with defaults + overrides (admin editor)
 *
 * Talks to the backend over plain JSON (/api/seo, /api/admin/seo). Swap the backend
 * (Cloudflare → Node/Express → Supabase → …) and only these URLs need to stay the same;
 * no component knows where SEO data comes from.
 */
import { adminGet, adminPut, adminDelete } from '../api/api';

const BASE = '/api';

async function get(url) {
  const res = await fetch(`${BASE}${url}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`SEO request failed (${res.status})`);
  return res.json();
}

export const getAllSEO = () => get('/seo');
export const getSEO = (page) => get(`/seo?page=${encodeURIComponent(page)}`).then(r => r.record);
export const getAdminOverview = () => adminGet('/seo');
export const updateSEO = (page, data) => adminPut('/seo', { ...data, page });
export const deleteSEO = (page) => adminDelete(`/seo?page=${encodeURIComponent(page)}`);

// ---- small client-side cache so route changes don't refetch overrides every time ----
let cache = null;
let inflight = null;
export function loadSeoRecords() {
  if (cache) return Promise.resolve(cache);
  inflight = inflight || getAllSEO()
    .then(d => { cache = { records: d?.records || {}, siteUrl: d?.site_url || '' }; return cache; })
    .catch(() => ({ records: {}, siteUrl: '' }))
    .finally(() => { inflight = null; });
  return inflight;
}
/** Call after the admin saves SEO so public pages pick up the change. */
export function invalidateSeo() { cache = null; }
