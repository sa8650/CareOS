import { json, parseBody } from '../../_middleware.js';
import { parseSectionRow, normalizeSectionBody } from '../../_lib/sections.js';

/** Admin: GET /api/admin/sections/:id */
export async function onRequestGet(context) {
  const db = context.env.DB;
  const row = await db.prepare('SELECT * FROM home_sections WHERE id = ?').bind(context.params.id).first();
  if (!row) return json({ error: 'Section not found' }, 404);
  return json(parseSectionRow(row));
}

/** Admin: PUT /api/admin/sections/:id -> partial update (only the fields sent) */
export async function onRequestPut(context) {
  const { id } = context.params;
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const db = context.env.DB;
  const existing = await db.prepare('SELECT * FROM home_sections WHERE id = ?').bind(id).first();
  if (!existing) return json({ error: 'Section not found' }, 404);

  const { data, error } = normalizeSectionBody(body, { partial: true });
  if (error) return json({ error }, 400);

  const keys = Object.keys(data);
  if (keys.length) {
    const sets = keys.map(k => `${k} = ?`).join(', ');
    await db.prepare(`UPDATE home_sections SET ${sets}, updated_at = datetime('now') WHERE id = ?`)
      .bind(...keys.map(k => data[k]), id).run();
  }
  const row = await db.prepare('SELECT * FROM home_sections WHERE id = ?').bind(id).first();
  return json({ success: true, section: parseSectionRow(row) });
}

/** Admin: DELETE /api/admin/sections/:id (also removes its uploaded images from R2) */
export async function onRequestDelete(context) {
  const { id } = context.params;
  const db = context.env.DB;
  const row = await db.prepare('SELECT * FROM home_sections WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'Section not found' }, 404);

  await db.prepare('DELETE FROM home_sections WHERE id = ?').bind(id).run();

  // Best-effort cleanup of R2 objects (only keys we uploaded, never external URLs)
  const R2 = context.env.R2;
  if (R2) {
    const imgs = parseSectionRow(row).images.filter(k => !/^https?:\/\//i.test(k));
    await Promise.all(imgs.map(k => R2.delete(k).catch(() => {})));
  }
  return json({ success: true });
}
