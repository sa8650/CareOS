import { parseBody, json } from '../_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare('SELECT * FROM availability ORDER BY day_of_week ASC').all();
  return json(results);
}

export async function onRequestPut(context) {
  const body = await parseBody(context.request);
  if (!body || !Array.isArray(body)) return json({ error: 'Expected array of availability slots' }, 400);

  const db = context.env.DB;

  // Delete all existing and re-insert
  await db.prepare('DELETE FROM availability').run();

  for (const slot of body) {
    await db.prepare(
      'INSERT INTO availability (day_of_week, start_time, end_time, slot_duration, is_active) VALUES (?, ?, ?, ?, ?)'
    ).bind(slot.day_of_week, slot.start_time, slot.end_time, slot.slot_duration || 30, slot.is_active ?? 1).run();
  }

  return json({ success: true });
}
