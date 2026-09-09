/**
 * SEO record schema — the shape stored in the database and exchanged with the API.
 * Provider-independent: the repository (D1 today, anything tomorrow) maps rows to this.
 *
 * Every field except `page` is optional. Empty string / null means "use the generated default".
 */
export const SEO_FIELDS = [
  'title',
  'description',
  'keywords',
  'canonical',
  'og_title',
  'og_description',
  'og_image',
  'robots',
  'schema_type',
  'schema_json',
];

export const ROBOTS_OPTIONS = [
  { value: '', label: 'Default (index, follow)' },
  { value: 'index, follow', label: 'index, follow' },
  { value: 'noindex, follow', label: 'noindex, follow' },
  { value: 'noindex, nofollow', label: 'noindex, nofollow' },
  { value: 'index, nofollow', label: 'index, nofollow' },
];

export const SCHEMA_TYPES = [
  { value: '', label: 'Auto (recommended)' },
  { value: 'Physician', label: 'Physician' },
  { value: 'MedicalClinic', label: 'MedicalClinic' },
  { value: 'MedicalBusiness', label: 'MedicalBusiness' },
  { value: 'LocalBusiness', label: 'LocalBusiness' },
  { value: 'MedicalProcedure', label: 'MedicalProcedure (service pages)' },
  { value: 'WebPage', label: 'WebPage' },
  { value: 'AboutPage', label: 'AboutPage' },
  { value: 'ContactPage', label: 'ContactPage' },
  { value: 'none', label: 'None (no structured data)' },
];

export const LIMITS = { title: 70, description: 170, og_title: 95, og_description: 200, keywords: 255 };

const str = (v) => (v == null ? '' : String(v)).trim();

/** Clean an incoming record (from admin form or API). Unknown keys are dropped. */
export function normalizeSeoRecord(input = {}) {
  const out = { page: str(input.page) };
  for (const f of SEO_FIELDS) out[f] = str(input[f]);

  // Basic hygiene
  out.keywords = out.keywords.split(',').map(k => k.trim()).filter(Boolean).join(', ');
  if (out.canonical && !/^(https?:\/\/|\/)/i.test(out.canonical)) out.canonical = '';
  // og_image may be an absolute URL, a site-relative path, or an uploaded object key
  // (e.g. "seo/1757000000-ab12cd.jpg", served through /api/image?key=...). Reject anything else.
  if (out.og_image && !/^(https?:\/\/|\/|[\w-]+\/[\w.-]+$)/i.test(out.og_image)) out.og_image = '';
  if (out.robots && !/^(index|noindex)(\s*,\s*(follow|nofollow))?$/i.test(out.robots)) out.robots = '';
  if (out.schema_json) {
    try { out.schema_json = JSON.stringify(JSON.parse(out.schema_json)); }
    catch { throw new Error('Custom schema JSON is not valid JSON'); }
  }
  if (input.updated_at) out.updated_at = str(input.updated_at);
  return out;
}

/** Validate a record; returns an array of error strings (empty = valid). */
export function validateSeoRecord(rec) {
  const errors = [];
  if (!rec.page) errors.push('page is required');
  if (rec.title.length > 200) errors.push('title is too long');
  if (rec.description.length > 400) errors.push('description is too long');
  return errors;
}

/** True when the record has no overrides at all (safe to delete). */
export function isEmptyRecord(rec) {
  return SEO_FIELDS.every(f => !str(rec?.[f]));
}
