import { parseBody, json } from '../../_middleware.js';
import { listChambers, validateChamberInput } from '../../_lib/schedule.js';

// GET /api/admin/chambers  -> all chambers (active + inactive)
export async function onRequestGet(context) {
  const chambers = await listChambers(context.env.DB);
  return json(chambers);
}

// POST /api/admin/chambers -> create chamber
export async function onRequestPost(context) {
  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const v = validateChamberInput(body);
  if (!v.ok) return json({ error: v.error }, 400);
  const d = v.data;

  if (d.start_time >= d.end_time) return json({ error: 'End time must be after start time' }, 400);

  const db = context.env.DB;
  const orderRow = await db.prepare('SELECT COALESCE(MAX(display_order), -1) + 1 AS o FROM chambers').first();

  const res = await db.prepare(
    `INSERT INTO chambers (name, address, phone, visiting_days, start_time, end_time, daily_limit, is_active, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    d.name, d.address ?? null, d.phone ?? null, d.visiting_days,
    d.start_time, d.end_time, d.daily_limit, d.is_active ?? 1,
    d.display_order ?? orderRow?.o ?? 0
  ).run();

  const created = await db.prepare('SELECT * FROM chambers WHERE id = ?').bind(res.meta.last_row_id).first();
  return json({ ...created, visiting_days: JSON.parse(created.visiting_days || '[]') }, 201);
}
