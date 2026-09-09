/**
 * Shared helpers for the admin-managed Home page "featured sections"
 * (table: home_sections). Used by the public and admin endpoints.
 */

export const MAX_IMAGES = 3;

/** Accepts an array, a JSON string, or newline text -> clean string[] */
export function toList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(v => String(v ?? '').trim()).filter(Boolean);
  const s = String(value).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try { return toList(JSON.parse(s)); } catch { /* fall through */ }
  }
  return s.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
}

/** DB row -> API object (benefits/images are arrays, is_active is a number) */
export function parseSectionRow(row) {
  if (!row) return null;
  return {
    ...row,
    benefits: toList(row.benefits),
    images: toList(row.images).slice(0, MAX_IMAGES),
    is_active: Number(row.is_active ?? 1),
    display_order: Number(row.display_order ?? 0),
  };
}

/** Validates + normalizes an incoming body. Returns { data } or { error } */
export function normalizeSectionBody(body, { partial = false } = {}) {
  const out = {};
  const str = v => (v == null ? null : String(v).trim() || null);

  if (body.title !== undefined || !partial) {
    const title = str(body.title);
    if (!title) return { error: 'Title is required' };
    if (title.length > 120) return { error: 'Title is too long (max 120 characters)' };
    out.title = title;
  }
  if (body.subtitle !== undefined) out.subtitle = str(body.subtitle);
  if (body.description !== undefined) out.description = str(body.description);
  if (body.button_text !== undefined) out.button_text = str(body.button_text);
  if (body.button_link !== undefined) {
    const link = str(body.button_link);
    if (link && !/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(link)) {
      return { error: 'Button link must start with http(s)://, / or #' };
    }
    out.button_link = link;
  }
  if (body.benefits !== undefined) out.benefits = JSON.stringify(toList(body.benefits).slice(0, 12));
  if (body.images !== undefined) {
    const imgs = toList(body.images);
    if (imgs.length > MAX_IMAGES) return { error: `Maximum ${MAX_IMAGES} images per section` };
    out.images = JSON.stringify(imgs);
  }
  if (body.display_order !== undefined) {
    const n = Number(body.display_order);
    out.display_order = Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  if (body.is_active !== undefined) out.is_active = body.is_active ? 1 : 0;

  return { data: out };
}
