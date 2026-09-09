import { parseBody, json } from '../../_middleware.js';
import { getChamber, validateChamberInput, COUNTED_SQL, localNow, getTimezone } from '../../_lib/schedule.js';

// GET /api/admin/chambers/:id
export async function onRequestGet(context) {
  const chamber = await getChamber(context.env.DB, context.params.id);
  if (!chamber) return json({ error: 'Chamber not found' }, 404);
  return json(chamber);
}

// PUT /api/admin/chambers/:id  (partial update allowed)
export async function onRequestPut(context) {
  const db = context.env.DB;
  const chamber = await getChamber(db, context.params.id);
  if (!chamber) return json({ error: 'Chamber not found' }, 404);

  const body = await parseBody(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const v = validateChamberInput(body, { partial: true });
  if (!v.ok) return json({ error: v.error }, 400);
  const d = v.data;

  const start = d.start_time ?? chamber.start_time;
  const end = d.end_time ?? chamber.end_time;
  if (start >= end) return json({ error: 'End time must be after start time' }, 400);

  const keys = Object.keys(d);
  if (keys.length === 0) return json({ error: 'Nothing to update' }, 400);

  const sets = keys.map(k => `${k} = ?`);
  const params = keys.map(k => d[k]);
  sets.push("updated_at = datetime('now')");
  params.push(chamber.id);

  await db.prepare(`UPDATE chambers SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run();
  const updated = await getChamber(db, chamber.id);
  return json(updated);
}

// DELETE /api/admin/chambers/:id
// Refuses when the chamber still has upcoming active appointments unless ?force=1
export async function onRequestDelete(context) {
  const db = context.env.DB;
  const chamber = await getChamber(db, context.params.id);
  if (!chamber) return json({ error: 'Chamber not found' }, 404);

  const url = new URL(context.request.url);
  const force = url.searchParams.get('force') === '1';
  const now = localNow(getTimezone(context.env));

  const upcoming = await db.prepare(
    `SELECT COUNT(*) AS c FROM appointments WHERE chamber_id = ? AND appointment_date >= ? AND ${COUNTED_SQL}`
  ).bind(chamber.id, now.date).first();

  if (Number(upcoming?.c || 0) > 0 && !force) {
    return json({
      error: `This chamber has ${upcoming.c} upcoming appointment(s). Cancel them first or delete with force.`,
      upcoming: Number(upcoming.c),
      requires_force: true,
    }, 409);
  }

  // Overrides cascade; appointments keep their history with chamber_id = NULL
  await db.prepare('DELETE FROM schedule_overrides WHERE chamber_id = ?').bind(chamber.id).run();
  await db.prepare('UPDATE appointments SET chamber_id = NULL WHERE chamber_id = ?').bind(chamber.id).run();
  await db.prepare('DELETE FROM chambers WHERE id = ?').bind(chamber.id).run();

  return json({ success: true });
}
