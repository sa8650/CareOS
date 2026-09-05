import { json } from './_middleware.js';

export async function onRequestGet(context) {
  const db = context.env.DB;
  const { results } = await db.prepare(
    'SELECT id, day_of_week, start_time, end_time, slot_duration, max_appointments, is_active FROM availability WHERE is_active = 1 ORDER BY day_of_week ASC'
  ).all();
  return json(results);
}
