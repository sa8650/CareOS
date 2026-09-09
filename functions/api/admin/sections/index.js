import { json, parseBody } from '../../_middleware.js';
import { parseSectionRow, normalizeSectionBody } from '../../_lib/sections.js';

const MISSING_TABLE = 'Table "home_sections" does not exist yet. Run migrations/002_home_sections.sql in the D1 console.';

/** Admin: GET /api/admin/sections -> all sections (active + hidden) */
export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    const { results } = await db
      .prepare('SELECT * FROM home_sections ORDER BY display_order ASC, id ASC')
      .all();
    return json(results.map(parseSectionRow));
  } catch (err) {
    if (/no such table/i.test(err?.message || '')) return json({ error: MISSING_TABLE }, 500);
    return json({ error: err.message }, 500);
  }
}

/** Admin: POST /api/admin/sections -> create */
export async function onRequestPost(context) {
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { data, error } = normalizeSectionBody(body);
  if (error) return json({ error }, 400);

  const db = context.env.DB;
  try {
    if (data.display_order === undefined) {
      const row = await db.prepare('SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM home_sections').first();
      data.display_order = Number(row?.next || 1);
    }
    const res = await db.prepare(
      `INSERT INTO home_sections (title, subtitle, description, benefits, images, button_text, button_link, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      data.title, data.subtitle ?? null, data.description ?? null,
      data.benefits ?? '[]', data.images ?? '[]',
      data.button_text ?? null, data.button_link ?? null,
      data.display_order, data.is_active ?? 1
    ).run();

    const id = res.meta?.last_row_id;
    const created = await db.prepare('SELECT * FROM home_sections WHERE id = ?').bind(id).first();
    return json({ success: true, section: parseSectionRow(created) }, 201);
  } catch (err) {
    if (/no such table/i.test(err?.message || '')) return json({ error: MISSING_TABLE }, 500);
    return json({ error: err.message }, 500);
  }
}
