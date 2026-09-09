/**
 * Public site data loader used by the SEO endpoints, sitemap and HTML injection.
 * Wraps the existing tables (doctor_profile, settings, chambers, services) — no new doctor tables.
 */
import { parseProfileRow } from './profile.js';
import { listChambers } from './schedule.js';
import { parseSectionRow } from './sections.js';

async function safe(promise, fallback) {
  try { return await promise; } catch { return fallback; }
}

export async function loadSiteData(db) {
  const [doctorRow, settingsRes, chambers, servicesRes, sectionsRes] = await Promise.all([
    safe(db.prepare('SELECT * FROM doctor_profile WHERE id = 1').first(), null),
    safe(db.prepare('SELECT key, value FROM settings').all(), { results: [] }),
    safe(listChambers(db, { activeOnly: true }), []),
    safe(db.prepare('SELECT id, name, slug, description, price, duration_minutes, image_url, benefits, faq, is_active, updated_at FROM services WHERE is_active = 1 ORDER BY created_at ASC').all(), { results: [] }),
    // Home "featured sections" (table may not exist before migration 002 → empty list)
    safe(db.prepare('SELECT * FROM home_sections WHERE is_active = 1 ORDER BY display_order ASC, id ASC').all(), { results: [] }),
  ]);

  const settings = {};
  for (const r of settingsRes.results || []) settings[r.key] = r.value;

  const services = (servicesRes.results || []).map(s => {
    try { s.benefits = JSON.parse(s.benefits || '[]'); } catch { s.benefits = []; }
    try { s.faq = JSON.parse(s.faq || '[]'); } catch { s.faq = []; }
    return s;
  });

  const doctor = doctorRow ? parseProfileRow(doctorRow) : null;
  const sections = (sectionsRes.results || []).map(parseSectionRow);
  return { doctor, settings, chambers: chambers || [], services, sections };
}

/** Site URL: Admin → SEO → Site URL wins; otherwise the request origin (works on any host/domain). */
export function resolveSiteUrl(settings, request) {
  const configured = String(settings?.seo_site_url || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  try { return new URL(request.url).origin; } catch { return ''; }
}
